/* Testa o admin contra o banco DE VERDADE: acesso, cadastro de cliente,
 * produto, cobranca avulsa e a leitura das faturas. Apaga tudo no fim.
 *   npm run teste:admin
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { sql } from "drizzle-orm";
import { consultar, db } from "@/db";
import {
  atualizarCliente,
  criarCliente,
  criarCobrancaAvulsa,
  criarProduto,
  lerCliente,
  listarClientes,
  listarFaturas,
  listarProdutos,
} from "@/db/admin";
import { conferirAdmin } from "@/lib/admin";
import { emReais, paraCentavos } from "@/lib/dinheiro";

const EMAIL = "admin-teste@exemplo.invalido";
let falhas = 0;
const ok = (c: boolean, m: string) => {
  if (!c) falhas++;
  console.log((c ? "  ok     " : "  FALHOU ") + m);
};

(async () => {
  console.log("1) conversao de dinheiro (nunca passa por float)");
  const casos: [string, number | null][] = [
    ["250,00", 25000], ["250", 25000], ["1.234,56", 123456],
    ["1234.56", 123456], ["R$ 40,00", 4000], ["0,05", 5],
    ["19,99", 1999], ["", null], ["abc", null],
  ];
  for (const [entrada, esperado] of casos) {
    const obtido = paraCentavos(entrada);
    ok(obtido === esperado, `"${entrada}" -> ${obtido} (esperado ${esperado})`);
  }
  ok(emReais(123456) === "1.234,56", `123456 centavos -> "${emReais(123456)}"`);
  ok(emReais(5) === "0,05", `5 centavos -> "${emReais(5)}"`);

  console.log("\n2) acesso do admin");
  const email = process.env.ADMIN_EMAIL!;
  ok(await conferirAdmin(email, "p3Ze3jUg8Nz8dqYzupXP7zRg"), "senha certa entra");
  ok(!(await conferirAdmin(email, "errada")), "senha errada nao entra");
  ok(!(await conferirAdmin("outro@x.com", "p3Ze3jUg8Nz8dqYzupXP7zRg")), "outro e-mail nao entra");

  console.log("\n3) cadastro de cliente");
  await db().execute(sql`delete from clientes where email = ${EMAIL}`);
  const clienteId = await criarCliente({
    nome: "Cliente de Teste", email: EMAIL.toUpperCase(),
    documento: "00000000000", telefone: "(00) 00000-0000",
  });
  const c = await lerCliente(clienteId);
  ok(c?.email === EMAIL, "e-mail gravado em minuscula mesmo digitado em MAIUSCULA");
  await atualizarCliente(clienteId, {
    nome: "Cliente Renomeado", email: EMAIL, documento: "24971563792", telefone: null,
  });
  const c2 = await lerCliente(clienteId);
  ok(c2?.nome === "Cliente Renomeado", "edicao grava o nome novo");
  ok(c2?.documento === "24971563792", "documento continua preenchido — agora e obrigatorio");
  ok(c2?.telefone === null, "campo opcional pode ser limpo");

  console.log("\n4) produto");
  await criarProduto(clienteId, {
    nome: "Site institucional", descricao: "landing + portal",
    tipo: "site", endereco: "exemplo.com.br",
    mensalidadeCentavos: paraCentavos("250,00"), diaVencimento: 10,
    status: "ativo", ativoDesde: "2026-01-15",
  });
  const prods = await listarProdutos(clienteId);
  ok(prods.length === 1, "produto cadastrado");
  ok(prods[0].mensalidadeCentavos === 25000, "mensalidade em centavos, inteiro");
  ok(prods[0].tipo === "site" && prods[0].status === "ativo", "tipo e status corretos");

  console.log("\n5) cobranca avulsa");
  await criarCobrancaAvulsa({
    clienteId, produtoId: prods[0].id,
    descricao: "feature nova no site",
    valorCentavos: paraCentavos("40,00")!,
    vencimento: "2026-10-05",
  });
  const fats = await listarFaturas(clienteId);
  ok(fats.length === 1, "fatura criada");
  ok(fats[0].tipo === "avulsa", "tipo avulsa");
  ok(fats[0].valorCentavos === 4000, "valor 4000 centavos");
  ok(fats[0].status === "aberta", "nasce em aberto");
  ok(fats[0].produtoNome === "Site institucional", "traz o nome do produto");
  ok(typeof fats[0].numero === "number" && fats[0].numero > 0, `numero sequencial: ${fats[0].numero}`);

  console.log("\n6) lista de clientes");
  const lista = await listarClientes();
  const meu = lista.find((x) => x.id === clienteId);
  ok(meu?.produtos === 1, "conta 1 produto");
  ok(meu?.emAberto === 1, "conta 1 fatura em aberto");

  await db().execute(sql`delete from faturas where cliente_id = ${clienteId}`);
  await db().execute(sql`delete from produtos where cliente_id = ${clienteId}`);
  await db().execute(sql`delete from clientes where id = ${clienteId}`);
  const sobra = await consultar<{ n: number }>(sql`select count(*)::int as n from clientes`);
  console.log(`\nlimpeza: clientes = ${sobra[0].n}`);
  console.log(falhas === 0 ? "\nTUDO PASSOU" : `\n${falhas} FALHA(S)`);
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => {
  console.log("ERRO:", e);
  process.exit(1);
});
