/* Testa a decisao de QUAL e-mail sai no "esqueci a senha", contra o banco
 * e a Resend de verdade. Gasta 2 e-mails da cota por rodada.
 *   npm run teste:recuperar
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { sql } from "drizzle-orm";
import { consultar, db } from "@/db";
import { garantirUsuario } from "@/db/tokens";
import { definirSenha } from "@/db/usuarios";
import { mandarLinkDeAcesso } from "@/lib/link-acesso";

const EMAIL = "recuperar-teste@exemplo.invalido";
let falhas = 0;
const ok = (c: boolean, m: string) => {
  if (!c) falhas++;
  console.log((c ? "  ok     " : "  FALHOU ") + m);
};

const ultimoEnvio = async (clienteId: string) =>
  (
    await consultar<{ tipo: string; status: string }>(sql`
      select tipo, status from emails_enviados
       where cliente_id = ${clienteId}
       order by criado_em desc limit 1
    `)
  )[0];

const tokensDe = async (clienteId: string) =>
  await consultar<{ tipo: string; usuario_id: string | null }>(sql`
    select tipo, usuario_id from tokens_acesso
     where cliente_id = ${clienteId} and usado_em is null
  `);

(async () => {
  await db().execute(sql`delete from clientes where email = ${EMAIL}`);
  const cli = await consultar<{ id: string }>(sql`
    insert into clientes (id, nome, email)
    values (gen_random_uuid()::text, 'Cliente de Teste', ${EMAIL})
    returning id
  `);
  const clienteId = cli[0].id;

  console.log("1) esqueci a senha, mas a conta nunca teve senha");
  await mandarLinkDeAcesso(EMAIL, "recuperar_senha");
  let envio = await ultimoEnvio(clienteId);
  ok(
    envio?.tipo === "primeiro_acesso",
    "manda o e-mail de PRIMEIRO ACESSO — nao da para recuperar o que nunca existiu",
  );
  ok(envio?.status === "enviado", "Resend aceitou");
  let toks = await tokensDe(clienteId);
  ok(toks.length === 1 && toks[0].tipo === "primeiro_acesso", "o token gravado e do tipo certo");

  console.log("\n2) agora com senha criada");
  const usuarioId = await garantirUsuario(clienteId, EMAIL);
  await definirSenha(usuarioId, "senhaDeTeste123");
  // a trava de 60s e por (cliente, tipo); como o tipo muda, este passa
  await mandarLinkDeAcesso(EMAIL, "recuperar_senha");
  envio = await ultimoEnvio(clienteId);
  ok(envio?.tipo === "recuperar_senha", "agora manda o de RECUPERAR SENHA");
  toks = await tokensDe(clienteId);
  const rec = toks.find((t) => t.tipo === "recuperar_senha");
  ok(!!rec, "token de recuperacao criado");
  ok(rec?.usuario_id === usuarioId, "o token aponta para o usuario certo, nao so para o cliente");

  console.log("\n3) e-mail que nao existe");
  const antes = (
    await consultar<{ n: number }>(sql`select count(*)::int as n from emails_enviados`)
  )[0].n;
  await mandarLinkDeAcesso("ninguem-mesmo@exemplo.invalido", "recuperar_senha");
  const depois = (
    await consultar<{ n: number }>(sql`select count(*)::int as n from emails_enviados`)
  )[0].n;
  ok(antes === depois, "nao manda nada, e nao estoura erro");

  console.log("\n4) trava de frequencia por tipo");
  const antesT = (await tokensDe(clienteId)).length;
  await mandarLinkDeAcesso(EMAIL, "recuperar_senha");
  ok((await tokensDe(clienteId)).length === antesT, "segundo pedido seguido do MESMO tipo e barrado");

  await db().execute(sql`delete from clientes where email = ${EMAIL}`);
  const sobra = await consultar<{ n: number }>(sql`select count(*)::int as n from clientes`);
  console.log(`\nlimpeza: clientes = ${sobra[0].n}`);
  console.log(falhas === 0 ? "\nTUDO PASSOU" : `\n${falhas} FALHA(S)`);
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => {
  console.log("ERRO:", e);
  process.exit(1);
});
