/* Testa o caminho AUTENTICADO contra o Worker rodando no workerd.
 *   npx wrangler dev --port 8788      (num terminal)
 *   npm run teste:worker              (noutro)
 *
 * Isto e o que o `next dev` nao prova. No workerd nao existe Node inteiro:
 * o driver do Neon, o pgcrypto pela conexao HTTP, o cookie de sessao e o
 * render de uma pagina com dado de cliente de verdade so contam como
 * testados aqui.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { sql } from "drizzle-orm";
import { consultar } from "@/db";
import { criarCliente, criarCobrancaAvulsa, criarProduto } from "@/db/admin";
import { garantirUsuario } from "@/db/tokens";
import { definirSenha, verificarLogin } from "@/db/usuarios";
import { abrirSessao } from "@/db/sessoes";

const BASE = process.env.WORKER_URL ?? "http://127.0.0.1:8788";
const EMAIL = "worker@exemplo.invalido";
const SENHA = "senhaDeTeste123";

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

/**
 * Apaga na ORDEM das dependencias, e sem engolir erro.
 *
 * `faturas.cliente_id` e `onDelete: restrict` de proposito — ninguem apaga
 * um cliente que tem fatura por acidente. Isso vale para o sistema e vale
 * aqui: a primeira versao deste script mandava um `delete from clientes`
 * solto com `.catch(() => {})`, o banco recusava, e ele imprimia "dados
 * removidos" mesmo assim. Limpeza que mente e pior do que limpeza nenhuma.
 */
async function limpar() {
  const alvo = sql`(select id from clientes where email = ${EMAIL})`;
  await consultar(sql`delete from sessoes where usuario_id in (select id from usuarios where cliente_id in ${alvo})`);
  await consultar(sql`delete from emails_enviados where cliente_id in ${alvo}`);
  await consultar(sql`delete from tokens_acesso where cliente_id in ${alvo}`);
  await consultar(sql`delete from faturas where cliente_id in ${alvo}`);
  await consultar(sql`delete from produtos where cliente_id in ${alvo}`);
  await consultar(sql`delete from usuarios where cliente_id in ${alvo}`);
  await consultar(sql`delete from clientes where email = ${EMAIL}`);
}

(async () => {
  // O Worker tem que estar de pe, senao o resto nao quer dizer nada.
  const vivo = await fetch(`${BASE}/portal/login`).catch(() => null);
  if (!vivo?.ok) {
    console.log(
      `ERRO: nada respondendo em ${BASE}.\n` +
        `Rode 'npx wrangler dev --port 8788' antes deste teste.`,
    );
    process.exit(1);
  }

  await limpar();

  const clienteId = await criarCliente({
    nome: "Cliente do Worker",
    email: EMAIL,
    documento: "24971563792",
    telefone: "11987654321",
  });
  const usuarioId = await garantirUsuario(clienteId, EMAIL);
  await definirSenha(usuarioId, SENHA);
  const produtoId = await criarProduto(clienteId, {
    nome: "Site do teste de Worker",
    descricao: null,
    tipo: "site",
    endereco: null,
    mensalidadeCentavos: null,
    diaVencimento: null,
    status: "ativo",
    ativoDesde: dia(-30),
  });
  const faturaId = await criarCobrancaAvulsa({
    clienteId,
    produtoId,
    descricao: "Fatura do teste de Worker",
    valorCentavos: 12345,
    vencimento: dia(5),
  });

  console.log("1) pgcrypto pela conexao HTTP do Neon");
  const login = await verificarLogin(EMAIL, SENHA);
  ok(login.situacao === "ok", "senha confere pelo crypt() dentro do Postgres");
  const errada = await verificarLogin(EMAIL, SENHA + "x");
  ok(errada.situacao !== "ok", "senha errada nao passa");

  console.log("\n2) o Worker renderiza pagina com dado de cliente de verdade");
  const token = await abrirSessao(usuarioId);
  const cookie = `sessao=${token}`;

  const faturas = await fetch(`${BASE}/portal/faturas`, {
    headers: { cookie },
    redirect: "manual",
  });
  ok(faturas.status === 200, `/portal/faturas responde 200 (veio ${faturas.status})`);
  const html = await faturas.text();
  ok(html.includes("123,45"), "o valor da fatura aparece na pagina");
  ok(html.includes("Fatura do teste de Worker"), "a descricao aparece");

  console.log("\n3) o checkout monta no workerd");
  const pag = await fetch(`${BASE}/portal/pagamento/${faturaId}`, {
    headers: { cookie },
    redirect: "manual",
  });
  ok(pag.status === 200, `/portal/pagamento/[id] responde 200 (veio ${pag.status})`);

  console.log("\n4) sessao invalida nao entra");
  const semSessao = await fetch(`${BASE}/portal/faturas`, { redirect: "manual" });
  ok(semSessao.status === 307, "sem cookie, redireciona para o login");
  const forjada = await fetch(`${BASE}/portal/faturas`, {
    headers: { cookie: "sessao=token-inventado-por-mim" },
    redirect: "manual",
  });
  ok(forjada.status === 307, "cookie forjado tambem cai no login");

  console.log("\n5) limpeza");
  await limpar();
  console.log("  dados de teste removidos");

  console.log(falhas === 0 ? "\nTUDO PASSOU" : `\n${falhas} FALHA(S)`);
  process.exit(falhas === 0 ? 0 : 1);
})().catch(async (e) => {
  await limpar();
  console.log("ERRO:", e instanceof Error ? e.message : e);
  process.exit(1);
});
