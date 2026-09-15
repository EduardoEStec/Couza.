/* Teste de senha, login e sessao contra o banco DE VERDADE.
 * Deixa um cliente de teste pronto e imprime o token de sessao, para o
 * teste de HTTP conferir o portao. Apaga tudo no fim, a menos que receba
 * o argumento "manter".
 *   npm run teste:sessao
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { sql } from "drizzle-orm";
import { consultar, db } from "@/db";
import {
  abrirSessao,
  apagarSessao,
  apagarSessoesDoUsuario,
  lerSessao,
  renovarSeprecisar,
} from "@/db/sessoes";
import {
  definirSenha,
  limparTentativas,
  registrarFalha,
  verificarLogin,
} from "@/db/usuarios";
import { garantirUsuario } from "@/db/tokens";
import { VALIDADE_SESSAO } from "@/lib/token";

const EMAIL = "sessao-teste@exemplo.invalido";
const SENHA = "umaSenhaBoa123";
const manter = process.argv.includes("manter");

let falhas = 0;
const ok = (c: boolean, m: string) => {
  if (!c) falhas++;
  console.log((c ? "  ok     " : "  FALHOU ") + m);
};

(async () => {
  await db().execute(sql`delete from clientes where email = ${EMAIL}`);
  const cli = await consultar<{ id: string }>(sql`
    insert into clientes (id, nome, email)
    values (gen_random_uuid()::text, 'Cliente de Teste', ${EMAIL})
    returning id
  `);
  const clienteId = cli[0].id;
  const usuarioId = await garantirUsuario(clienteId, EMAIL);

  console.log("1) conta sem senha ainda");
  ok((await verificarLogin(EMAIL, SENHA)).situacao === "sem_senha", "login recusado: sem_senha");

  console.log("\n2) definir senha");
  await definirSenha(usuarioId, SENHA);
  const r1 = await verificarLogin(EMAIL, SENHA);
  ok(r1.situacao === "ok", "senha certa entra");
  ok(r1.situacao === "ok" && r1.clienteId === clienteId, "devolve o cliente certo");
  ok((await verificarLogin(EMAIL, "errada")).situacao === "senha_errada", "senha errada recusada");
  ok((await verificarLogin("nao-existe@exemplo.invalido", SENHA)).situacao === "sem_conta", "e-mail inexistente recusado");
  ok((await verificarLogin(EMAIL.toUpperCase(), SENHA)).situacao === "ok", "e-mail em MAIUSCULA entra igual");

  console.log("\n3) trava por tentativas");
  for (let i = 0; i < 5; i++) await registrarFalha(usuarioId);
  ok((await verificarLogin(EMAIL, SENHA)).situacao === "bloqueada", "trava apos 5 falhas, mesmo com a senha CERTA");
  await limparTentativas(usuarioId);
  ok((await verificarLogin(EMAIL, SENHA)).situacao === "ok", "limpar tentativas destrava");

  console.log("\n4) sessao");
  const token = await abrirSessao(usuarioId);
  const s = await lerSessao(token);
  ok(s !== null, "sessao valida e lida de volta");
  ok(s?.nome === "Cliente de Teste", "traz o nome do cliente");
  const guardado = await consultar<{ token_hash: string }>(sql`
    select token_hash from sessoes where usuario_id = ${usuarioId}
  `);
  ok(guardado[0].token_hash !== token, "o banco NAO guarda o token de sessao cru");

  ok((await lerSessao("token-inventado")) === null, "token inventado nao abre sessao");

  console.log("\n5) renovacao deslizante");
  ok(!(await renovarSeprecisar(token)), "sessao nova ainda nao renova");
  await db().execute(sql`
    update sessoes set expira_em = now() + make_interval(secs => ${VALIDADE_SESSAO / 4000})
     where usuario_id = ${usuarioId}
  `);
  ok(await renovarSeprecisar(token), "passando da metade, renova");

  console.log("\n6) desativar usuario derruba a sessao");
  await db().execute(sql`update usuarios set ativo = false where id = ${usuarioId}`);
  ok((await lerSessao(token)) === null, "usuario inativo perde a sessao na hora");
  await db().execute(sql`update usuarios set ativo = true where id = ${usuarioId}`);
  ok((await lerSessao(token)) !== null, "reativar devolve");

  console.log("\n7) sair");
  await apagarSessao(token);
  ok((await lerSessao(token)) === null, "sair invalida o token");

  console.log("\n8) trocar a senha derruba tudo que estava aberto");
  const t1 = await abrirSessao(usuarioId);
  const t2 = await abrirSessao(usuarioId);
  ok((await lerSessao(t1)) !== null && (await lerSessao(t2)) !== null, "duas sessoes abertas");
  await apagarSessoesDoUsuario(usuarioId);
  ok((await lerSessao(t1)) === null && (await lerSessao(t2)) === null, "as duas caem");

  if (manter) {
    const vivo = await abrirSessao(usuarioId);
    console.log("\nCLIENTE MANTIDO para o teste de HTTP");
    console.log("TOKEN=" + vivo);
  } else {
    await db().execute(sql`delete from clientes where email = ${EMAIL}`);
    const sobra = await consultar<{ n: number }>(sql`select count(*)::int as n from clientes`);
    console.log(`\nlimpeza: clientes = ${sobra[0].n}`);
  }

  console.log(falhas === 0 ? "\nTUDO PASSOU" : `\n${falhas} FALHA(S)`);
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => {
  console.log("ERRO:", e);
  process.exit(1);
});
