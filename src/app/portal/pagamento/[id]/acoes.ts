"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirSessao } from "@/lib/sessao";
import { faturaDoCliente } from "@/db/portal";
import { dadosDoPagador, marcarPagaLocal } from "@/db/pagamento";
import { mensagemDoErro, pagarComCartao } from "@/lib/asaas";

export type EstadoPagamento = { erro?: string };

/**
 * REGRA QUE NAO SE QUEBRA NESTE ARQUIVO:
 *
 * O numero do cartao e o CVV entram aqui, vao direto para a chamada do
 * Asaas, e morrem. Eles NUNCA:
 *   - sao gravados em lugar nenhum
 *   - entram em console.log, em objeto de log ou em mensagem de erro
 *   - sao guardados em variavel que sobreviva a esta funcao
 *
 * O Guilherme aceitou conscientemente que o dado transite pelo servidor
 * (etapa 7, 15/09/2026), sabendo que isso o coloca no escopo do PCI-DSS.
 * O que impede vazamento aqui e disciplina, nao infraestrutura — entao
 * qualquer mudanca neste arquivo precisa respeitar isso.
 */

/** IP do PAGADOR. O Asaas usa na analise de fraude e recusa o do servidor. */
async function ipDoPagador(): Promise<string> {
  const h = await headers();
  const cf = h.get("cf-connecting-ip");
  if (cf) return cf;
  const encaminhado = h.get("x-forwarded-for");
  if (encaminhado) return encaminhado.split(",")[0].trim();
  return "127.0.0.1";
}

export async function pagarNoCartao(
  _anterior: EstadoPagamento,
  dados: FormData,
): Promise<EstadoPagamento> {
  const sessao = await exigirSessao();
  const faturaId = String(dados.get("faturaId") ?? "");

  const fatura = await faturaDoCliente(sessao.clienteId, faturaId);
  if (!fatura) return { erro: "Fatura não encontrada." };
  if (fatura.statusExibido === "paga") return { erro: "Esta fatura já está paga." };

  const pagador = await dadosDoPagador(sessao.clienteId, faturaId);
  if (!pagador?.asaasCobrancaId) {
    return {
      erro:
        "Esta fatura ainda não está registrada no Asaas. Me chame que eu " +
        "resolvo — não tente pagar de outro jeito.",
    };
  }

  const titular = {
    nome: String(dados.get("titularNome") ?? "").trim(),
    email: pagador.email,
    cpfCnpj: String(dados.get("titularCpf") ?? ""),
    cep: String(dados.get("titularCep") ?? ""),
    numeroEndereco: String(dados.get("titularNumero") ?? "").trim(),
    telefone: String(dados.get("titularTelefone") ?? ""),
  };

  const faltando = camposFaltando(titular, dados);
  if (faltando) return { erro: faltando };

  try {
    const r = await pagarComCartao(
      pagador.asaasCobrancaId,
      {
        // Os quatro campos sensiveis, lidos e passados adiante na mesma linha.
        numero: String(dados.get("numero") ?? ""),
        nomeImpresso: String(dados.get("titularNome") ?? "").trim(),
        mesValidade: String(dados.get("mes") ?? "").padStart(2, "0"),
        anoValidade: anoCompleto(String(dados.get("ano") ?? "")),
        cvv: String(dados.get("cvv") ?? ""),
      },
      titular,
      await ipDoPagador(),
    );

    if (r.status === "CONFIRMED" || r.status === "RECEIVED") {
      // Marca aqui tambem, sem esperar o webhook: o cliente acabou de pagar
      // e nao pode ver "em aberto" ao voltar. O webhook chega depois e nao
      // reescreve nada, por causa da trava de status.
      await marcarPagaLocal(faturaId, "cartao");
      revalidatePath("/portal/faturas");
      revalidatePath("/portal");
      redirect(`/portal/pagamento/${faturaId}/pronto`);
    }

    if (r.status === "AWAITING_RISK_ANALYSIS") {
      return {
        erro:
          "O pagamento entrou em análise manual de risco do Asaas. Assim que " +
          "eles aprovarem, a fatura muda sozinha aqui. Não pague de novo.",
      };
    }

    return {
      erro: `O pagamento não foi aprovado (situação: ${r.status}). Confira os dados ou tente outro cartão.`,
    };
  } catch (e) {
    // mensagemDoErro traduz o erro do Asaas. Ela NUNCA recebe o cartao.
    return { erro: mensagemDoErro(e) };
  }
}

function anoCompleto(ano: string): string {
  const d = ano.replace(/\D/g, "");
  return d.length === 2 ? `20${d}` : d;
}

function camposFaltando(
  titular: { nome: string; cpfCnpj: string; cep: string; numeroEndereco: string; telefone: string },
  dados: FormData,
): string | null {
  const digitos = (v: string) => v.replace(/\D/g, "");

  if (titular.nome.length < 3) return "Informe o nome como está impresso no cartão.";
  if (digitos(String(dados.get("numero") ?? "")).length < 13) {
    return "Número do cartão incompleto.";
  }
  if (digitos(String(dados.get("cvv") ?? "")).length < 3) return "CVV incompleto.";
  if (!/^\d{1,2}$/.test(String(dados.get("mes") ?? ""))) return "Mês de validade inválido.";
  if (digitos(String(dados.get("ano") ?? "")).length < 2) return "Ano de validade inválido.";

  // O Asaas EXIGE todos estes do titular — ver a referencia de
  // payWithCreditCard. Faltando um, ele recusa a cobranca inteira.
  const doc = digitos(titular.cpfCnpj);
  if (doc.length !== 11 && doc.length !== 14) return "CPF ou CNPJ do titular inválido.";
  if (digitos(titular.cep).length !== 8) return "CEP do titular inválido.";
  if (titular.numeroEndereco === "") return "Informe o número do endereço do titular.";
  const tel = digitos(titular.telefone);
  if (tel.length !== 10 && tel.length !== 11) return "Telefone do titular inválido.";

  return null;
}
