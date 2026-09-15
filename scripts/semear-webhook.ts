/* Prepara dados para o teste HTTP do webhook e imprime os ids.
 * Usado por scripts/teste-webhook.sh — nao roda sozinho.
 *   npm run semear:webhook          prepara
 *   npm run semear:webhook -- fim   confere o resultado e limpa
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { sql } from "drizzle-orm";
import { consultar, db } from "@/db";
import { criarCliente, criarCobrancaAvulsa, criarProduto } from "@/db/admin";

const EMAIL = "webhook-teste@exemplo.invalido";
const COBRANCA = "pay_teste_webhook_001";

async function limpar() {
  await db().execute(sql`
    delete from eventos_asaas where asaas_cobranca_id like 'pay_teste_webhook%'
  `);
  await db().execute(sql`
    delete from faturas where cliente_id in (select id from clientes where email = ${EMAIL})
  `);
  await db().execute(sql`
    delete from produtos where cliente_id in (select id from clientes where email = ${EMAIL})
  `);
  await db().execute(sql`delete from clientes where email = ${EMAIL}`);
}

(async () => {
  if (process.argv.includes("fim")) {
    const f = await consultar<{ status: string; pago_em: string | null; forma_pagamento: string | null }>(sql`
      select status, pago_em, forma_pagamento from faturas
       where asaas_cobranca_id = ${COBRANCA}
    `);
    const ev = await consultar<{ tipo: string; processado_em: string | null; erro: string | null }>(sql`
      select tipo, processado_em, erro from eventos_asaas
       where asaas_cobranca_id like 'pay_teste_webhook%' order by criado_em
    `);
    console.log("FATURA:", JSON.stringify(f[0] ?? null));
    console.log("EVENTOS GRAVADOS:", ev.length);
    for (const e of ev) {
      console.log(`  ${e.tipo.padEnd(24)} processado=${e.processado_em ? "sim" : "NAO"} ${e.erro ? "erro=" + e.erro : ""}`);
    }
    await limpar();
    const sobra = await consultar<{ n: number }>(sql`select count(*)::int as n from eventos_asaas`);
    console.log("limpeza: eventos restantes =", sobra[0].n);
    process.exit(0);
  }

  await limpar();
  const clienteId = await criarCliente({
    nome: "Cliente Webhook", email: EMAIL, documento: "24971563792", telefone: null,
  });
  const produtoId = await criarProduto(clienteId, {
    nome: "Produto Webhook", descricao: null, tipo: "site", endereco: null,
    mensalidadeCentavos: null, diaVencimento: null, status: "ativo", ativoDesde: null,
  });
  const faturaId = await criarCobrancaAvulsa({
    clienteId, produtoId, descricao: "cobranca de teste",
    valorCentavos: 5000, vencimento: new Date().toISOString().slice(0, 10),
  });
  // Finge que ja foi sincronizada com o Asaas.
  await db().execute(sql`
    update faturas set asaas_cobranca_id = ${COBRANCA} where id = ${faturaId}
  `);

  console.log("FATURA_ID=" + faturaId);
  console.log("COBRANCA_ID=" + COBRANCA);
  process.exit(0);
})().catch((e) => {
  console.log("ERRO:", e);
  process.exit(1);
});
