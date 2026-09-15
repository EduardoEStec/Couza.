/* Testa o checkout contra o SANDBOX do Asaas: Pix, boleto e cartão.
 * Usa SÓ cartão fictício de teste, como a documentação deles exige.
 * Apaga tudo no fim, dos dois lados.
 *   npm run teste:checkout
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import {
  criarClienteAsaas,
  criarCobranca,
  FalhaAsaas,
  lerCobranca,
  mensagemDoErro,
  obterBoleto,
  obterPix,
  pagarComCartao,
} from "@/lib/asaas";
import { chamar } from "@/lib/asaas/cliente-http";

/** Cartão de recusa da própria documentação do Asaas. */
const RECUSADO = "5184019740373151";

/**
 * Número fictício de formato válido, para o caminho aprovado.
 *
 * TEM QUE SER VISA. Medido no sandbox em 15/09/2026: números Mastercard
 * fictícios e válidos (5162306219378829, 5555555555554444) voltam HTTP 500
 * "unknow.error" em vez de aprovar. É defeito do sandbox deles, não nosso —
 * os Visa aprovam na hora.
 */
const APROVADO = "4539620659922097";

const TITULAR = {
  nome: "Titular de Teste",
  email: "titular@exemplo.invalido",
  cpfCnpj: "24971563792",
  cep: "01310100",
  numeroEndereco: "1000",
  telefone: "11987654321",
};

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
  const cli = await criarClienteAsaas({
    nome: "Cliente Checkout Teste",
    documento: "24971563792",
    email: "checkout@exemplo.invalido",
    telefone: "11987654321",
    referencia: "teste-checkout",
  });

  console.log("1) Pix");
  const paraPix = await criarCobranca({
    clienteAsaasId: cli.id, valorCentavos: 3990,
    vencimento: daquiA(3), descricao: "Teste Pix", referencia: "f1",
  });
  const pix = await obterPix(paraPix.id);
  ok(pix.encodedImage.length > 100, `QR em base64 (${pix.encodedImage.length} caracteres)`);
  ok(!pix.encodedImage.startsWith("data:"), "vem SEM o prefixo data: — a tela precisa adicionar");
  ok(pix.payload.length > 50, `copia e cola (${pix.payload.length} caracteres)`);
  ok(pix.payload.includes("BR.GOV.BCB.PIX") || /^000201/.test(pix.payload), "payload no formato EMV do Pix");
  ok(!!pix.expirationDate, `expira em ${pix.expirationDate}`);

  console.log("\n2) Boleto");
  const boleto = await obterBoleto(paraPix.id);
  ok(boleto.identificationField.replace(/\D/g, "").length >= 44,
     `linha digitável: ${boleto.identificationField.slice(0, 24)}…`);
  ok(boleto.barCode.replace(/\D/g, "").length === 44, "código de barras com 44 dígitos");
  const comUrl = await lerCobranca(paraPix.id);
  ok(!!comUrl.bankSlipUrl, "veio a URL do PDF do boleto");

  console.log("\n3) Cartão RECUSADO — o caminho que mais importa tratar");
  const paraRecusa = await criarCobranca({
    clienteAsaasId: cli.id, valorCentavos: 1000,
    vencimento: daquiA(3), descricao: "Teste recusa", referencia: "f2",
  });
  try {
    const r = await pagarComCartao(
      paraRecusa.id,
      { numero: RECUSADO, nomeImpresso: TITULAR.nome, mesValidade: "12", anoValidade: "2030", cvv: "123" },
      TITULAR, "189.6.1.1",
    );
    ok(r.status !== "CONFIRMED" && r.status !== "RECEIVED", `não aprovou, status ${r.status}`);
  } catch (e) {
    ok(e instanceof FalhaAsaas, "recusa vem como erro tipado");
    // O sandbox as vezes devolve 500 no lugar da recusa. Os dois caminhos
    // precisam dizer a pessoa o que fazer — nenhum pode virar "[object]".
    const msg = mensagemDoErro(e);
    ok(msg.length > 0 && !/undefined|\[object/.test(msg), `mensagem acionável: "${msg}"`);
  }

  console.log("\n4) Cartão APROVADO");
  const paraCartao = await criarCobranca({
    clienteAsaasId: cli.id, valorCentavos: 2500,
    vencimento: daquiA(3), descricao: "Teste cartão", referencia: "f3",
  });
  try {
    const r = await pagarComCartao(
      paraCartao.id,
      { numero: APROVADO, nomeImpresso: TITULAR.nome, mesValidade: "12", anoValidade: "2030", cvv: "123" },
      TITULAR, "189.6.1.1",
    );
    ok(r.status === "CONFIRMED" || r.status === "RECEIVED", `aprovado: ${r.status}`);
    ok((r.creditCard?.creditCardNumber ?? "").length === 4,
       `volta só os 4 últimos: ${r.creditCard?.creditCardNumber}`);
    ok(!!r.creditCard?.creditCardBrand, `bandeira: ${r.creditCard?.creditCardBrand}`);
  } catch (e) {
    ok(false, "cartão aprovado falhou: " + mensagemDoErro(e));
  }

  console.log("\n4b) tradução dos erros — mapa, não sorte do sandbox");
  const d500 = mensagemDoErro(
    new FalhaAsaas(500, [{ code: "unknow.error", description: "Ocorreu um erro desconhecido." }], "POST /x"),
  );
  ok(/nada foi cobrado/i.test(d500), `falha interna avisa que nada foi cobrado: "${d500}"`);
  ok(/chave/i.test(mensagemDoErro(new FalhaAsaas(401, [], "POST /x"))), "401 fala da chave, não do cliente");
  ok(/segundos/i.test(mensagemDoErro(new FalhaAsaas(429, [], "POST /x"))), "429 pede para tentar em instantes");
  const d400 = mensagemDoErro(
    new FalhaAsaas(400, [{ code: "invalid_action", description: "Transação não autorizada." }], "POST /x"),
  );
  ok(d400.includes("Transação não autorizada"), "recusa de verdade preserva o motivo do Asaas");

  console.log("\n5) titular incompleto é recusado pelo Asaas");
  const paraFalta = await criarCobranca({
    clienteAsaasId: cli.id, valorCentavos: 1000,
    vencimento: daquiA(3), descricao: "Teste titular", referencia: "f4",
  });
  try {
    await pagarComCartao(
      paraFalta.id,
      { numero: APROVADO, nomeImpresso: TITULAR.nome, mesValidade: "12", anoValidade: "2030", cvv: "123" },
      { ...TITULAR, cep: "" }, "189.6.1.1",
    );
    ok(false, "deveria ter recusado sem CEP");
  } catch (e) {
    ok(e instanceof FalhaAsaas, `sem CEP o Asaas recusa: "${mensagemDoErro(e)}"`);
  }

  console.log("\n6) limpeza no sandbox");
  for (const id of [paraPix.id, paraRecusa.id, paraFalta.id]) {
    await chamar("DELETE", `/payments/${id}`).catch(() => {});
  }
  await chamar("DELETE", `/customers/${cli.id}`).catch(() => {});
  console.log("  cobranças de teste removidas (a paga fica, não dá para apagar)");

  console.log(falhas === 0 ? "\nTUDO PASSOU" : `\n${falhas} FALHA(S)`);
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => {
  console.log("ERRO:", mensagemDoErro(e));
  process.exit(1);
});
