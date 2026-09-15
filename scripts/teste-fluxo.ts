/* Teste do fluxo de primeiro acesso, contra o banco e a Resend DE VERDADE.
 * Cria um cliente descartavel, exercita o caminho inteiro e apaga no fim.
 * Gasta 1 e-mail da cota a cada rodada (vai para o simulador da Resend).
 *   npm run teste:fluxo
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { sql } from "drizzle-orm";
import { render } from "@react-email/components";
import { consultar, db } from "@/db";
import {
  acharDestino,
  conferirLink,
  consumirLink,
  criarLink,
  garantirUsuario,
  podePedirLink,
} from "@/db/tokens";
import { hashToken } from "@/lib/token";
import { enviarEmail, urlBase } from "@/lib/email";
import { PrimeiroAcesso } from "@/emails/primeiro-acesso";

const EMAIL = "fluxo-teste@exemplo.invalido";
let falhas = 0;
const ok = (c: boolean, m: string) => {
  if (!c) falhas++;
  console.log((c ? "  ok     " : "  FALHOU ") + m);
};

async function limpar() {
  await db().execute(sql`delete from clientes where email = ${EMAIL}`);
}

(async () => {
  await limpar();
  await db().execute(sql`
    insert into clientes (id, nome, email)
    values (gen_random_uuid()::text, 'Cliente de Teste', ${EMAIL})
  `);

  console.log("1) achar o cliente pelo e-mail");
  const d = await acharDestino(EMAIL.toUpperCase());
  ok(d !== null, "acha mesmo com o e-mail em MAIUSCULA");
  ok(d?.usuarioId === null, "usuario ainda nao existe (nasce ao criar a senha)");

  console.log("\n2) e-mail que nao existe");
  ok((await acharDestino("ninguem@exemplo.invalido")) === null, "devolve null");

  console.log("\n3) criar o link");
  ok(await podePedirLink(d!.clienteId, "primeiro_acesso"), "pode pedir");
  const token = await criarLink(d!.clienteId, null, "primeiro_acesso");
  ok(token.length > 30, `token gerado (${token.length} caracteres)`);

  const guardado = await consultar<{ token_hash: string }>(sql`
    select token_hash from tokens_acesso where cliente_id = ${d!.clienteId} and usado_em is null
  `);
  ok(guardado.length === 1, "uma linha de token no banco");
  ok(guardado[0].token_hash !== token, "o banco NAO guarda o token cru");
  ok(guardado[0].token_hash === (await hashToken(token)), "guarda o SHA-256 dele");

  console.log("\n4) trava de frequencia");
  ok(!(await podePedirLink(d!.clienteId, "primeiro_acesso")), "segundo pedido em seguida e barrado");

  console.log("\n5) pedir outro link invalida o anterior");
  const token2 = await criarLink(d!.clienteId, null, "primeiro_acesso");
  const velho = await conferirLink(token);
  ok(!velho.valido && velho.motivo === "usado", "o link antigo morreu");
  ok((await conferirLink(token2)).valido, "o novo vale");

  console.log("\n6) uso unico");
  const c = await conferirLink(token2);
  ok(c.valido, "confere antes de consumir");
  if (c.valido) {
    ok(await consumirLink(c.tokenId), "primeiro consumo funciona");
    ok(!(await consumirLink(c.tokenId)), "segundo consumo e recusado");
    const depois = await conferirLink(token2);
    ok(!depois.valido && depois.motivo === "usado", "depois de usado, nao vale mais");
  }

  console.log("\n7) link expirado");
  const t3 = await criarLink(d!.clienteId, null, "recuperar_senha");
  await db().execute(sql`
    update tokens_acesso set expira_em = now() - interval '1 minute'
     where token_hash = ${await hashToken(t3)}
  `);
  const exp = await conferirLink(t3);
  ok(!exp.valido && exp.motivo === "expirado", "link vencido e recusado");

  console.log("\n8) token inventado");
  const inv = await conferirLink("token-que-nunca-existiu");
  ok(!inv.valido && inv.motivo === "inexistente", "token desconhecido e recusado");

  console.log("\n9) nascimento do usuario");
  const uid = await garantirUsuario(d!.clienteId, EMAIL);
  ok(!!uid, "usuario criado");
  ok((await garantirUsuario(d!.clienteId, EMAIL)) === uid, "chamar de novo devolve o mesmo, nao duplica");

  console.log("\n10) e-mail de verdade pela Resend");
  const html = await render(
    PrimeiroAcesso({
      nome: d!.nome,
      url: `${urlBase()}/portal/criar-senha/${token2}`,
      validadeTexto: "1 hora",
    }),
  );
  ok(html.includes("<table"), "o React Email gerou tabela (compativel com Outlook)");
  ok(html.includes("Criar minha senha"), "o botao esta no HTML");
  ok(!html.includes("class="), "nenhuma classe sobrou — Tailwind inlinou tudo");
  ok(html.length < 102 * 1024, `tamanho ${Math.round(html.length / 1024)}KB, abaixo do corte de 102KB do Gmail`);

  const env = await enviarEmail({
    para: "delivered@resend.dev",
    assunto: "Teste do fluxo — courte",
    html,
    tipo: "primeiro_acesso",
    clienteId: d!.clienteId,
  });
  ok(env.ok, "Resend aceitou: " + JSON.stringify(env));

  const log = await consultar<{ tipo: string; status: string; resend_id: string }>(sql`
    select tipo, status, resend_id from emails_enviados where cliente_id = ${d!.clienteId}
  `);
  ok(log.length === 1 && log[0].status === "enviado", "envio registrado no banco");

  await limpar();
  const sobra = await consultar<{ n: number }>(sql`select count(*)::int as n from clientes`);
  console.log(`\nlimpeza: clientes = ${sobra[0].n}`);
  console.log(falhas === 0 ? "\nTUDO PASSOU" : `\n${falhas} FALHA(S)`);
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => {
  console.log("ERRO:", e);
  process.exit(1);
});
