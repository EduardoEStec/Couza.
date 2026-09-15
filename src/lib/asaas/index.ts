/**
 * Integracao com o Asaas — API v3.
 *
 * Documentacao consultada em 15/09/2026. Nada aqui foi escrito de memoria:
 * campos, valores aceitos e formatos vieram da referencia oficial.
 *
 * FRONTEIRA DE CONVERSAO: o nosso banco guarda centavos inteiros; o Asaas
 * quer reais com decimais ("value": 19.9). A conversao acontece SO aqui.
 */

import { chamar, FalhaAsaas } from "./cliente-http";

export { FalhaAsaas, ambienteAtivo } from "./cliente-http";

/** 2500 centavos -> 25. O toFixed trava em duas casas antes de virar numero. */
function emReaisParaApi(centavos: number): number {
  return Number((centavos / 100).toFixed(2));
}

/* ------------------------------------------------------------------ *
 * Clientes
 * ------------------------------------------------------------------ */

export type ClienteAsaas = {
  id: string;
  name: string;
  cpfCnpj: string;
  email: string | null;
};

export type DadosClienteAsaas = {
  nome: string;
  /** OBRIGATORIO pelo Asaas. Sem ele nao da para criar cliente la. */
  documento: string;
  email: string;
  telefone: string | null;
  /** O nosso id, para cruzar os dois lados depois. */
  referencia: string;
};

/**
 * Cria o cliente no Asaas e devolve o id deles (formato "cus_000005401844").
 *
 * `cpfCnpj` e obrigatorio do lado do Asaas — nao e escolha nossa. Quem chama
 * precisa garantir que o documento existe; ver `podeSincronizar` abaixo.
 */
export async function criarClienteAsaas(
  d: DadosClienteAsaas,
): Promise<ClienteAsaas> {
  return chamar<ClienteAsaas>("POST", "/customers", {
    name: d.nome,
    cpfCnpj: soDigitos(d.documento),
    email: d.email,
    mobilePhone: celularOuNada(d.telefone),
    externalReference: d.referencia,
  });
}

export async function atualizarClienteAsaas(
  asaasId: string,
  d: DadosClienteAsaas,
): Promise<ClienteAsaas> {
  return chamar<ClienteAsaas>("PUT", `/customers/${asaasId}`, {
    name: d.nome,
    cpfCnpj: soDigitos(d.documento),
    email: d.email,
    mobilePhone: celularOuNada(d.telefone),
    externalReference: d.referencia,
  });
}

/**
 * Por que existe: o CPF/CNPJ e opcional no NOSSO cadastro (decisao do
 * Guilherme) e obrigatorio no Asaas. Em vez de estourar na chamada, a tela
 * pergunta antes e mostra uma frase que a pessoa entende.
 */
export function podeSincronizar(documento: string | null): boolean {
  return !!documento && soDigitos(documento).length >= 11;
}

function soDigitos(s: string): string {
  return s.replace(/\D/g, "");
}

/**
 * O Asaas VALIDA o celular e recusa o cadastro INTEIRO se ele nao for
 * plausivel — descoberto na marra: "(11) 99999-9999" foi rejeitado com
 * `invalid_mobilePhone`.
 *
 * Telefone e opcional para eles, entao numero incompleto e melhor omitido
 * do que enviado: perder o telefone la nao impede cobrar, mas travar o
 * cadastro do cliente impede.
 */
function celularOuNada(telefone: string | null): string | undefined {
  if (!telefone) return undefined;
  const d = soDigitos(telefone);
  return d.length === 10 || d.length === 11 ? d : undefined;
}

/* ------------------------------------------------------------------ *
 * Assinatura recorrente — a mensalidade do produto
 * ------------------------------------------------------------------ */

export type AssinaturaAsaas = {
  id: string;
  customer: string;
  value: number;
  nextDueDate: string;
  cycle: string;
  status: string;
};

export type DadosAssinatura = {
  clienteAsaasId: string;
  valorCentavos: number;
  /** Primeiro vencimento, no formato YYYY-MM-DD. */
  proximoVencimento: string;
  descricao: string;
  referencia: string;
};

/**
 * `billingType: "UNDEFINED"` de proposito: deixa o cliente escolher a forma
 * na hora de pagar, que e justamente o que o nosso checkout oferece. Fixar
 * BOLETO ou PIX aqui tiraria a escolha dele.
 */
export async function criarAssinatura(
  d: DadosAssinatura,
): Promise<AssinaturaAsaas> {
  return chamar<AssinaturaAsaas>("POST", "/subscriptions", {
    customer: d.clienteAsaasId,
    billingType: "UNDEFINED",
    value: emReaisParaApi(d.valorCentavos),
    nextDueDate: d.proximoVencimento,
    cycle: "MONTHLY",
    description: d.descricao.slice(0, 500),
    externalReference: d.referencia,
  });
}

export async function cancelarAssinatura(asaasId: string): Promise<void> {
  await chamar("DELETE", `/subscriptions/${asaasId}`);
}

/* ------------------------------------------------------------------ *
 * Cobranca avulsa
 * ------------------------------------------------------------------ */

/** Status possiveis de uma cobranca, conforme a referencia da API. */
export type StatusCobrancaAsaas =
  | "PENDING"
  | "RECEIVED"
  | "CONFIRMED"
  | "OVERDUE"
  | "REFUNDED"
  | "RECEIVED_IN_CASH"
  | "REFUND_REQUESTED"
  | "REFUND_IN_PROGRESS"
  | "CHARGEBACK_REQUESTED"
  | "CHARGEBACK_DISPUTE"
  | "AWAITING_CHARGEBACK_REVERSAL"
  | "DUNNING_REQUESTED"
  | "DUNNING_RECEIVED"
  | "AWAITING_RISK_ANALYSIS";

export type CobrancaAsaas = {
  id: string;
  customer: string;
  value: number;
  dueDate: string;
  status: StatusCobrancaAsaas;
  invoiceUrl?: string;
  bankSlipUrl?: string;
};

export type DadosCobranca = {
  clienteAsaasId: string;
  valorCentavos: number;
  vencimento: string;
  descricao: string;
  referencia: string;
};

export async function criarCobranca(d: DadosCobranca): Promise<CobrancaAsaas> {
  return chamar<CobrancaAsaas>("POST", "/payments", {
    customer: d.clienteAsaasId,
    billingType: "UNDEFINED",
    value: emReaisParaApi(d.valorCentavos),
    dueDate: d.vencimento,
    description: d.descricao.slice(0, 500),
    externalReference: d.referencia,
  });
}

export async function lerCobranca(asaasId: string): Promise<CobrancaAsaas> {
  return chamar<CobrancaAsaas>("GET", `/payments/${asaasId}`);
}

/* ------------------------------------------------------------------ *
 * Mensagem para a tela
 * ------------------------------------------------------------------ */

/**
 * Erro do Asaas nunca pode virar tela branca — exigencia do ETAPAS.md.
 * Traduz o que der para traduzir e devolve algo legivel para o resto.
 */
export function mensagemDoErro(e: unknown): string {
  if (e instanceof FalhaAsaas) {
    if (e.status === 401) {
      return "A chave do Asaas foi recusada. Confira ASAAS_API_KEY e ASAAS_AMBIENTE.";
    }
    return `Asaas recusou: ${e.message}`;
  }
  if (e instanceof Error) return e.message;
  return "Falha ao falar com o Asaas.";
}
