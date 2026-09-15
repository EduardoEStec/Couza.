/* Testa o portal com dado real: dois clientes, e a garantia de que um nao
 * enxerga nada do outro. Apaga tudo no fim.
 *   npm run teste:portal
 *   npm run teste:portal -- manter     (deixa os dados e imprime os ids)
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { sql } from "drizzle-orm";
import { consultar, db } from "@/db";
import { criarCliente, criarCobrancaAvulsa, criarProduto } from "@/db/admin";
import { garantirUsuario } from "@/db/tokens";
import { definirSenha } from "@/db/usuarios";
import { abrirSessao } from "@/db/sessoes";
import {
  faturaDoCliente,
  faturasDoCliente,
  produtosDoCliente,
  resumoDoCliente,
} from "@/db/portal";
import { paraCentavos } from "@/lib/dinheiro";

const A = "portal-a@exemplo.invalido";
const B = "portal-b@exemplo.invalido";
const manter = process.argv.includes("manter");

let falhas = 0;
const ok = (c: boolean, m: string) => {
  if (!c) falhas++;
  console.log((c ? "  ok     " : "  FALHOU ") + m);
};

const dia = (offset: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
};

async function limpar() {
  await db().execute(sql`
    delete from faturas where cliente_id in (select id from clientes where email in (${A}, ${B}))
  `);
  await db().execute(sql`
    delete from produtos where cliente_id in (select id from clientes where email in (${A}, ${B}))
  `);
  await db().execute(sql`delete from clientes where email in (${A}, ${B})`);
}

(async () => {
  await limpar();

  const idA = await criarCliente({ nome: "Cliente A", email: A, documento: "11111111111", telefone: null });
  const idB = await criarCliente({ nome: "Cliente B", email: B, documento: "24971563792", telefone: null });

  await criarProduto(idA, {
    nome: "Site do A", descricao: "landing", tipo: "site", endereco: "a.com.br",
    mensalidadeCentavos: paraCentavos("250,00"), diaVencimento: 10,
    status: "ativo", ativoDesde: "2026-01-10",
  });
  await criarProduto(idA, {
    nome: "Sistema pausado", descricao: null, tipo: "sistema", endereco: null,
    mensalidadeCentavos: paraCentavos("500,00"), diaVencimento: 20,
    status: "pausado", ativoDesde: "2026-02-01",
  });
  await criarProduto(idB, {
    nome: "Site do B", descricao: null, tipo: "site", endereco: null,
    mensalidadeCentavos: paraCentavos("100,00"), diaVencimento: 5,
    status: "ativo", ativoDesde: "2026-03-01",
  });

  const prodsA = await produtosDoCliente(idA);
  const prodsB = await produtosDoCliente(idB);

  console.log("1) cada um ve so o que e seu");
  ok(prodsA.length === 2, `A ve 2 produtos (viu ${prodsA.length})`);
  ok(prodsB.length === 1, `B ve 1 produto (viu ${prodsB.length})`);
  ok(!prodsA.some((p) => p.nome === "Site do B"), "A nao ve produto do B");
  ok(prodsA[0].nome === "Site do A", "ativo vem antes do pausado na ordem");

  console.log("\n2) proxima cobranca calculada pelo dia do contrato");
  ok(!!prodsA[0].proximaCobranca, `produto ativo tem proxima cobranca: ${prodsA[0].proximaCobranca}`);
  ok(
    prodsA[0].proximaCobranca?.slice(-2) === "10",
    "cai no dia 10, como o contrato diz",
  );
  ok(prodsA[1].proximaCobranca === null, "produto PAUSADO nao tem proxima cobranca");

  console.log("\n3) faturas nos tres estados");
  const siteA = prodsA[0].id;
  await criarCobrancaAvulsa({ clienteId: idA, produtoId: siteA, descricao: "atrasada", valorCentavos: 4000, vencimento: dia(-5) });
  await criarCobrancaAvulsa({ clienteId: idA, produtoId: siteA, descricao: "vence logo", valorCentavos: 3000, vencimento: dia(3) });
  await criarCobrancaAvulsa({ clienteId: idA, produtoId: siteA, descricao: "futura", valorCentavos: 2000, vencimento: dia(30) });
  await criarCobrancaAvulsa({ clienteId: idA, produtoId: siteA, descricao: "ja paga", valorCentavos: 1000, vencimento: dia(-40) });
  await db().execute(sql`
    update faturas set status = 'paga', pago_em = now(), forma_pagamento = 'pix'
     where cliente_id = ${idA} and descricao = 'ja paga'
  `);
  await criarCobrancaAvulsa({ clienteId: idB, produtoId: prodsB[0].id, descricao: "do B", valorCentavos: 9900, vencimento: dia(2) });

  const todas = await faturasDoCliente(idA, "todas");
  ok(todas.length === 4, `A ve 4 faturas (viu ${todas.length})`);
  ok(!todas.some((f) => f.descricao === "do B"), "A nao ve fatura do B");
  ok(todas[0].descricao === "atrasada", "atrasada vem primeiro na ordem");

  const estado = (d: string) => todas.find((f) => f.descricao === d)?.statusExibido;
  ok(estado("atrasada") === "atrasada", "vencida vira 'atrasada' sem estar gravada assim");
  ok(estado("vence logo") === "aberta", "a vencer fica 'aberta'");
  ok(estado("ja paga") === "paga", "paga fica 'paga' mesmo tendo vencido ha 40 dias");

  console.log("\n4) filtros");
  ok((await faturasDoCliente(idA, "atrasada")).length === 1, "filtro atrasada devolve 1");
  ok((await faturasDoCliente(idA, "paga")).length === 1, "filtro paga devolve 1");
  ok((await faturasDoCliente(idA, "aberta")).length === 2, "filtro em aberto devolve 2");

  console.log("\n5) dias ate vencer");
  ok(todas.find((f) => f.descricao === "atrasada")!.diasAteVencer === -5, "atrasada: -5 dias");
  ok(todas.find((f) => f.descricao === "futura")!.diasAteVencer === 30, "futura: +30 dias");

  console.log("\n6) resumo do topo");
  const r = await resumoDoCliente(idA);
  ok(r.totalMensalCentavos === 25000, `total mensal so do ATIVO: ${r.totalMensalCentavos} (pausado nao entra)`);
  ok(r.atrasadasQtd === 1 && r.atrasadasCentavos === 4000, "em atraso: 1 fatura, 4000 centavos");
  ok(r.aVencerQtd === 2 && r.aVencerCentavos === 5000, "a vencer: 2 faturas, 5000 centavos");

  console.log("\n7) A TRAVA: um cliente nao abre a fatura do outro");
  const faturaDoB = (await faturasDoCliente(idB, "todas"))[0];
  ok((await faturaDoCliente(idB, faturaDoB.id)) !== null, "B abre a propria fatura");
  ok((await faturaDoCliente(idA, faturaDoB.id)) === null, "A NAO abre a fatura do B, mesmo sabendo o id");
  ok((await faturaDoCliente(idA, "id-inventado")) === null, "id inventado nao abre nada");

  console.log("\n8) cliente novo, sem nada");
  const idVazio = await criarCliente({ nome: "Cliente Vazio", email: "vazio@exemplo.invalido", documento: "24971563792", telefone: null });
  ok((await produtosDoCliente(idVazio)).length === 0, "sem produto, lista vazia — nao inventa exemplo");
  ok((await faturasDoCliente(idVazio, "todas")).length === 0, "sem fatura, lista vazia");
  const rv = await resumoDoCliente(idVazio);
  ok(rv.totalMensalCentavos === 0 && rv.atrasadasQtd === 0, "resumo zerado, nao nulo");
  await db().execute(sql`delete from clientes where id = ${idVazio}`);

  if (manter) {
    const uA = await garantirUsuario(idA, A);
    await definirSenha(uA, "senhaDeTeste123");
    console.log("\nDADOS MANTIDOS");
    console.log("TOKEN_A=" + (await abrirSessao(uA)));
    console.log("FATURA_B=" + faturaDoB.id);
  } else {
    await limpar();
    const s = await consultar<{ n: number }>(sql`select count(*)::int as n from clientes`);
    console.log(`\nlimpeza: clientes = ${s[0].n}`);
  }

  console.log(falhas === 0 ? "\nTUDO PASSOU" : `\n${falhas} FALHA(S)`);
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => {
  console.log("ERRO:", e);
  process.exit(1);
});
