/* Testa a integracao contra o SANDBOX do Asaas. Cria cliente, assinatura e
 * cobranca de verdade la, confere os valores e apaga no fim.
 *   npm run teste:asaas
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import {
  ambienteAtivo,
  cancelarAssinatura,
  criarAssinatura,
  criarClienteAsaas,
  criarCobranca,
  FalhaAsaas,
  lerCobranca,
  mensagemDoErro,
  podeSincronizar,
} from "@/lib/asaas";
import { chamar } from "@/lib/asaas/cliente-http";

let falhas = 0;
const ok = (c: boolean, m: string) => {
  if (!c) falhas++;
  console.log((c ? "  ok     " : "  FALHOU ") + m);
};

const daquiA = (dias: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
};

(async () => {
  console.log("0) trava de ambiente");
  ok(ambienteAtivo() === "sandbox", `ambiente ativo: ${ambienteAtivo()}`);

  // A trava que impede repetir o erro da chave de producao no sandbox.
  const guardado = process.env.ASAAS_API_KEY_SANDBOX;
  process.env.ASAAS_API_KEY_SANDBOX = "$aact_prod_chaveErrada";
  let barrou = false;
  try {
    await chamar("GET", "/customers?limit=1");
  } catch (e) {
    barrou = e instanceof Error && /não pertence ao ambiente/.test(e.message);
  }
  ok(barrou, "chave de PRODUCAO em ambiente sandbox e barrada ANTES de sair requisicao");
  process.env.ASAAS_API_KEY_SANDBOX = guardado;

  console.log("\n1) exigencia de CPF/CNPJ");
  ok(!podeSincronizar(null), "sem documento, nao sincroniza");
  ok(!podeSincronizar("123"), "documento curto demais, nao sincroniza");
  ok(podeSincronizar("123.456.789-09"), "CPF formatado passa");

  console.log("\n2) cliente no Asaas");
  const cli = await criarClienteAsaas({
    nome: "Cliente de Teste courte",
    documento: "24971563792", // CPF de teste publico do sandbox
    email: "teste@exemplo.invalido",
    telefone: "(11) 98765-4321",
    referencia: "teste-local-1",
  });
  ok(cli.id.startsWith("cus_"), `id no formato esperado: ${cli.id}`);
  ok(cli.name === "Cliente de Teste courte", "nome gravado");

  const semTelefone = await criarClienteAsaas({
    nome: "Cliente sem telefone bom",
    documento: "24971563792",
    email: "teste2@exemplo.invalido",
    telefone: "123",
    referencia: "teste-local-2",
  });
  ok(!!semTelefone.id, "telefone incompleto e OMITIDO, o cadastro nao quebra");
  await chamar("DELETE", `/customers/${semTelefone.id}`);

  console.log("\n3) assinatura mensal — 250,00 sai como 250");
  const ass = await criarAssinatura({
    clienteAsaasId: cli.id,
    valorCentavos: 25000,
    proximoVencimento: daquiA(10),
    descricao: "Mensalidade do site — teste",
    referencia: "produto-teste-1",
  });
  ok(ass.id.startsWith("sub_"), `id da assinatura: ${ass.id}`);
  ok(ass.value === 250, `value = ${ass.value} (25000 centavos viraram 250 reais)`);
  ok(ass.cycle === "MONTHLY", `ciclo: ${ass.cycle}`);

  console.log("\n4) cobranca avulsa — 19,99 e o caso que pega float");
  const cob = await criarCobranca({
    clienteAsaasId: cli.id,
    valorCentavos: 1999,
    vencimento: daquiA(5),
    descricao: "Feature nova no site — teste",
    referencia: "fatura-teste-1",
  });
  ok(cob.id.startsWith("pay_"), `id da cobranca: ${cob.id}`);
  ok(cob.value === 19.99, `value = ${cob.value} (1999 centavos, sem sujeira de float)`);
  ok(cob.status === "PENDING", `nasce como ${cob.status}`);

  console.log("\n5) leitura de volta");
  const relida = await lerCobranca(cob.id);
  ok(relida.value === 19.99, "valor bate na leitura");
  ok(!!relida.invoiceUrl, "veio a URL da fatura do Asaas");

  console.log("\n6) erro tratado, nunca tela branca");
  try {
    await criarCobranca({
      clienteAsaasId: "cus_naoExiste",
      valorCentavos: 100,
      vencimento: daquiA(1),
      descricao: "deve falhar",
      referencia: "x",
    });
    ok(false, "deveria ter falhado");
  } catch (e) {
    ok(e instanceof FalhaAsaas, "erro vem como FalhaAsaas, tipado");
    const msg = mensagemDoErro(e);
    ok(msg.length > 0 && !msg.includes("undefined"), `mensagem legivel: "${msg}"`);
  }

  console.log("\n7) limpeza no sandbox");
  await cancelarAssinatura(ass.id);
  await chamar("DELETE", `/payments/${cob.id}`);
  await chamar("DELETE", `/customers/${cli.id}`);
  const restantes = await chamar<{ totalCount: number }>("GET", "/customers?limit=1");
  console.log(`  clientes restantes no sandbox: ${restantes.totalCount}`);

  console.log(falhas === 0 ? "\nTUDO PASSOU" : `\n${falhas} FALHA(S)`);
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => {
  console.log("ERRO:", mensagemDoErro(e));
  console.log(e);
  process.exit(1);
});
