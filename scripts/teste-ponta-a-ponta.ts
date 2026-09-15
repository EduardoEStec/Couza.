/* O teste que fecha o circuito: cobranca de verdade no Asaas, paga com
 * cartao ficticio, e o evento REAL deles chegando no endpoint REAL.
 *   npm run teste:ponta
 *
 * Por que isto e diferente de tudo que ja foi testado: ate agora o webhook
 * so viu um corpo que EU escrevi. Se eu tivesse errado o nome de um campo,
 * todos os testes passariam e a producao quebraria calada. Aqui quem monta
 * o corpo e o Asaas.
 *
 * Roda contra https://courte.com.br, com ASAAS_AMBIENTE=sandbox dos dois
 * lados. Nenhum dinheiro se move.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { sql } from "drizzle-orm";
import { consultar } from "@/db";
import { criarCliente, criarCobrancaAvulsa, criarProduto } from "@/db/admin";
import { sincronizarCliente, sincronizarCobranca } from "@/db/asaas-sync";
import { ambienteAtivo, mensagemDoErro, pagarComCartao } from "@/lib/asaas";

const EMAIL = "ponta-a-ponta@exemplo.invalido";
/** Visa ficticio. Mastercard ficticio da erro 500 no sandbox deles. */
const CARTAO = "4539620659922097";

let falhas = 0;
const ok = (c: boolean, m: string) => {
  if (!c) falhas++;
  console.log((c ? "  ok     " : "  FALHOU ") + m);
};

const dia = (n: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const esperar = (ms: number) => new Promise((p) => setTimeout(p, ms));

async function limpar() {
  const alvo = sql`(select id from clientes where email = ${EMAIL})`;
  await consultar(sql`delete from eventos_asaas where fatura_id in (select id from faturas where cliente_id in ${alvo})`);
  await consultar(sql`delete from sessoes where usuario_id in (select id from usuarios where cliente_id in ${alvo})`);
  await consultar(sql`delete from emails_enviados where cliente_id in ${alvo}`);
  await consultar(sql`delete from tokens_acesso where cliente_id in ${alvo}`);
  await consultar(sql`delete from faturas where cliente_id in ${alvo}`);
  await consultar(sql`delete from produtos where cliente_id in ${alvo}`);
  await consultar(sql`delete from usuarios where cliente_id in ${alvo}`);
  await consultar(sql`delete from clientes where email = ${EMAIL}`);
}

(async () => {
  if (ambienteAtivo() !== "sandbox") {
    console.log("ERRO: ASAAS_AMBIENTE nao e sandbox. Este teste cria cobranca de verdade.");
    process.exit(1);
  }

  await limpar();

  console.log("1) cliente e cobranca, nossos e no Asaas");
  const clienteId = await criarCliente({
    nome: "Cliente Ponta a Ponta",
    email: EMAIL,
    documento: "24971563792",
    telefone: "11987654321",
  });
  const sincC = await sincronizarCliente(clienteId);
  ok(sincC.ok, sincC.ok ? "cliente criado no Asaas" : `cliente NAO foi: ${"aviso" in sincC ? sincC.aviso : ""}`);

  const produtoId = await criarProduto(clienteId, {
    nome: "Site do teste ponta a ponta",
    descricao: null, tipo: "site", endereco: null,
    mensalidadeCentavos: null, diaVencimento: null,
    status: "ativo", ativoDesde: dia(-10),
  });
  const faturaId = await criarCobrancaAvulsa({
    clienteId, produtoId,
    descricao: "Cobranca do teste ponta a ponta",
    valorCentavos: 1990,
    vencimento: dia(5),
  });
  const sincF = await sincronizarCobranca(faturaId);
  ok(sincF.ok, sincF.ok ? "cobranca criada no Asaas" : `cobranca NAO foi: ${"aviso" in sincF ? sincF.aviso : ""}`);

  const [f] = await consultar<{ asaasCobrancaId: string; numero: number }>(sql`
    select asaas_cobranca_id as "asaasCobrancaId", numero
      from faturas where id = ${faturaId}
  `);
  ok(!!f?.asaasCobrancaId, `fatura #${f?.numero} ligada a ${f?.asaasCobrancaId}`);
  if (!f?.asaasCobrancaId) { await limpar(); process.exit(1); }

  console.log("\n2) pagando com cartao ficticio");
  try {
    const r = await pagarComCartao(
      f.asaasCobrancaId,
      { numero: CARTAO, nomeImpresso: "Cliente Ponta a Ponta", mesValidade: "12", anoValidade: "2030", cvv: "123" },
      { nome: "Cliente Ponta a Ponta", email: EMAIL, cpfCnpj: "24971563792",
        cep: "01310100", numeroEndereco: "1000", telefone: "11987654321" },
      "189.6.1.1",
    );
    ok(r.status === "CONFIRMED" || r.status === "RECEIVED", `Asaas aprovou: ${r.status}`);
  } catch (e) {
    ok(false, "pagamento falhou: " + mensagemDoErro(e));
    await limpar();
    process.exit(1);
  }

  console.log("\n3) esperando o webhook REAL do Asaas chegar em courte.com.br");
  /**
   * Espera o evento de PAGAMENTO, nao o primeiro evento qualquer.
   *
   * O envio do Asaas e SEQUENCIAL: primeiro chega PAYMENT_CREATED (a
   * cobranca nasceu), so depois PAYMENT_CONFIRMED. A primeira versao deste
   * teste parava no primeiro que chegasse e concluia que a fatura nao tinha
   * sido paga — errado, ela so nao tinha sido paga AINDA.
   */
  const PAGOU = ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"];
  let chegou = false;
  let vistos: string[] = [];
  for (let i = 0; i < 45; i++) {
    await esperar(2000);
    vistos = (await consultar<{ tipo: string }>(sql`
      select tipo from eventos_asaas
       where asaas_cobranca_id = ${f.asaasCobrancaId}
       order by criado_em
    `)).map((e) => e.tipo);
    if (vistos.some((t) => PAGOU.includes(t))) {
      chegou = true;
      console.log(`  evento de pagamento chegou em ~${(i + 1) * 2}s`);
      break;
    }
    if (i % 5 === 4) console.log(`  ...${(i + 1) * 2}s  (recebidos ate agora: ${vistos.join(", ") || "nenhum"})`);
  }
  ok(chegou, chegou
    ? `o Asaas entregou: ${vistos.join(", ")}`
    : `em 90s vieram so: ${vistos.join(", ") || "nenhum"}`);

  if (chegou) {
    const eventos = await consultar<{ tipo: string; processadoEm: string | null; erro: string | null; payload: unknown }>(sql`
      select tipo, processado_em::text as "processadoEm", erro, payload
        from eventos_asaas where asaas_cobranca_id = ${f.asaasCobrancaId}
       order by criado_em
    `);
    console.log(`  eventos recebidos: ${eventos.map((e) => e.tipo).join(", ")}`);
    ok(eventos.some((e) => e.tipo === "PAYMENT_CREATED"),
       "PAYMENT_CREATED tambem chega, e e ignorado sem erro (nao esta em nenhum balde)");
    ok(eventos.every((e) => !e.erro), eventos.find((e) => e.erro)?.erro ?? "nenhum evento deu erro ao processar");

    console.log("\n4) o CORPO que o Asaas manda de verdade");
    const doPagamento = eventos.find((e) => PAGOU.includes(e.tipo)) ?? eventos[0];
    const p = doPagamento.payload as Record<string, unknown>;
    const pay = (p.payment ?? {}) as Record<string, unknown>;
    // Os campos que src/app/api/asaas/webhook/route.ts assume existir.
    ok(typeof p.id === "string", `id do evento presente (${p.id})`);
    ok(typeof p.event === "string", `event presente (${p.event})`);
    ok(typeof pay.id === "string", `payment.id presente (${pay.id})`);
    ok(typeof pay.status === "string", `payment.status presente (${pay.status})`);
    ok(typeof pay.billingType === "string", `payment.billingType presente (${pay.billingType})`);
    const temData = ["paymentDate", "confirmedDate", "clientPaymentDate"].some((k) => typeof pay[k] === "string");
    ok(temData, "veio ao menos uma das datas de pagamento");

    console.log("\n5) a fatura ficou paga sozinha");
    const [depois] = await consultar<{ status: string; forma: string | null; pagoEm: string | null }>(sql`
      select status, forma_pagamento as forma, pago_em::text as "pagoEm"
        from faturas where id = ${faturaId}
    `);
    ok(depois.status === "paga", `status = ${depois.status}`);
    ok(depois.forma === "cartao", `forma = ${depois.forma}`);
    ok(!!depois.pagoEm, `pago em ${depois.pagoEm}`);

    console.log("\n6) o e-mail de confirmacao saiu");
    const [em] = await consultar<{ tipo: string; status: string; erro: string | null }>(sql`
      select tipo, status, erro from emails_enviados where fatura_id = ${faturaId}
    `);
    if (em) {
      ok(em.status === "enviado", `${em.tipo}: ${em.status}${em.erro ? " — " + em.erro : ""}`);
    } else {
      ok(false, "nenhum e-mail de confirmacao foi registrado");
    }
  }

  console.log("\n7) limpeza");
  await limpar();
  const [sobrou] = await consultar<{ n: string }>(sql`
    select count(*)::text as n from clientes where email = ${EMAIL}
  `);
  ok(sobrou.n === "0", "dados de teste removidos do banco (conferido)");
  console.log("  a cobranca paga fica no sandbox do Asaas — la nao da para apagar paga");

  console.log(falhas === 0 ? "\nTUDO PASSOU" : `\n${falhas} FALHA(S)`);
  process.exit(falhas === 0 ? 0 : 1);
})().catch(async (e) => {
  await limpar().catch(() => {});
  console.log("ERRO:", e instanceof Error ? e.message : e);
  process.exit(1);
});
