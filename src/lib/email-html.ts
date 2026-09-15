/**
 * Monta o HTML do e-mail trocando os marcadores da peça pré-renderizada.
 *
 * É o que substitui o render do React no caminho do envio. O React já rodou
 * uma vez, na máquina do Guilherme (scripts/gerar-emails.ts); aqui só sobra
 * troca de texto, que custa microssegundos em vez dos ~8 ms por e-mail.
 *
 * O PONTO DELICADO É O ESCAPE. O React escapava sozinho; troca de string
 * não escapa nada. Um cliente cadastrado como `Loja <b>Legal</b>` ou uma
 * descrição com aspas entraria como HTML de verdade no e-mail. Por isso
 * TODO valor passa por `escapar()` — não é zelo, é o que o React fazia e
 * que agora é responsabilidade nossa.
 */

import { EMAILS, type ChaveEmail } from "@/emails/gerados";

/** Mesmo conjunto que o React escapa ao interpolar texto. */
const TABELA: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapar(valor: string): string {
  return valor.replace(/[&<>"']/g, (c) => TABELA[c]);
}

export type ValoresCobranca = {
  nome: string;
  numero: string;
  descricao: string;
  /** Já em reais, sem o "R$". */
  valor: string;
  /** Já em dd/mm/aaaa. */
  vencimento: string;
  url: string;
};

function trocar(base: string, valores: Record<string, string>): string {
  let html = base;
  for (const [chave, bruto] of Object.entries(valores)) {
    html = html.split(`%%${chave}%%`).join(escapar(bruto));
  }
  return html;
}

export function montarCobranca(
  momento: "cobranca_nova" | "cobranca_lembrete" | "cobranca_vencida",
  v: ValoresCobranca,
): string {
  return trocar(EMAILS[momento], { ...v });
}

/** Como o cliente pagou, por extenso. Vazio quando o Asaas não disse. */
const NOME_DA_FORMA: Record<string, string> = {
  cartao: "cartão",
  pix: "Pix",
  boleto: "boleto",
};

export function montarConfirmacao(v: {
  nome: string;
  numero: string;
  descricao: string;
  valor: string;
  url: string;
  forma: string | null;
}): string {
  const porExtenso = v.forma ? (NOME_DA_FORMA[v.forma] ?? "") : "";

  // Sem forma conhecida, a peça é outra: a frase não menciona como pagou.
  const chave: ChaveEmail = porExtenso
    ? "pagamento_confirmado"
    : "pagamento_confirmado_sem_forma";

  return trocar(EMAILS[chave], {
    nome: v.nome,
    numero: v.numero,
    descricao: v.descricao,
    valor: v.valor,
    url: v.url,
    ...(porExtenso ? { forma: porExtenso } : {}),
  });
}

export function montarLinkAcesso(
  tipo: "primeiro_acesso" | "recuperar_senha",
  v: { nome: string; url: string; validade: string },
): string {
  return trocar(EMAILS[tipo], { ...v });
}
