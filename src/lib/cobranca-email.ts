/**
 * A rotina diária de e-mails de cobrança.
 *
 * Isto é uma função, não uma rota, de propósito: quem dispara (o Cron
 * Trigger da Cloudflare, ou o script de teste, ou eu na mão) não muda o que
 * acontece. A rota em src/app/api/cron/cobrancas é só a porta.
 */

import { render } from "@react-email/components";
import {
  LIMITE_POR_EXECUCAO,
  lembretes,
  novas,
  vencidas,
  faturaPaga,
  type FaturaParaEmail,
} from "@/db/cobrancas-email";
import { enviarUmaVez, liberarTravadas, urlBase } from "@/lib/email";
import { Cobranca, type MomentoCobranca } from "@/emails/cobranca";
import { PagamentoConfirmado } from "@/emails/pagamento-confirmado";
import { emReais } from "@/lib/dinheiro";

export type Resumo = {
  enviados: number;
  pulados: number;
  falhas: number;
  detalhes: string[];
};

const ASSUNTO: Record<MomentoCobranca, (f: FaturaParaEmail) => string> = {
  cobranca_nova: (f) => `Nova cobrança de R$ ${emReais(f.valorCentavos)} — courte`,
  cobranca_lembrete: (f) =>
    `Sua cobrança de R$ ${emReais(f.valorCentavos)} vence em 3 dias — courte`,
  cobranca_vencida: (f) =>
    `Cobrança de R$ ${emReais(f.valorCentavos)} vencida — courte`,
};

async function mandarLote(
  faturas: FaturaParaEmail[],
  momento: MomentoCobranca,
  resumo: Resumo,
  simular: boolean,
): Promise<void> {
  for (const f of faturas) {
    const assunto = ASSUNTO[momento](f);

    if (simular) {
      resumo.detalhes.push(`[simulado] ${momento} → ${f.email} — ${assunto}`);
      resumo.pulados++;
      continue;
    }

    const html = await render(
      Cobranca({
        nome: f.nome,
        numero: f.numero,
        descricao: f.descricao,
        valorCentavos: f.valorCentavos,
        vencimento: f.vencimento,
        url: `${urlBase()}/portal/pagamento/${f.id}`,
        momento,
      }),
    );

    const r = await enviarUmaVez({
      para: f.email,
      assunto,
      html,
      tipo: momento,
      clienteId: f.clienteId,
      faturaId: f.id,
    });

    if (r.ok === "pulou") {
      resumo.pulados++;
    } else if (r.ok) {
      resumo.enviados++;
      resumo.detalhes.push(`${momento} → ${f.email} (fatura ${f.numero})`);
    } else {
      resumo.falhas++;
      // O endereço entra no detalhe, o conteúdo do e-mail nunca.
      resumo.detalhes.push(`FALHOU ${momento} → ${f.email}: ${r.erro}`);
    }
  }
}

/**
 * Uma execução completa. `simular` lista o que sairia sem mandar nada —
 * serve para olhar antes de ligar isso de verdade pela primeira vez.
 */
export async function rodarCobrancas(simular = false): Promise<Resumo> {
  const resumo: Resumo = { enviados: 0, pulados: 0, falhas: 0, detalhes: [] };

  // Antes de qualquer coisa: solta o que ficou preso de uma execucao que
  // morreu no meio. Sem isso a fatura ficaria marcada como avisada sem
  // nunca ter sido avisada.
  const soltas = await liberarTravadas();
  if (soltas > 0) {
    resumo.detalhes.push(
      `${soltas} envio(s) presos de uma execucao anterior foram liberados.`,
    );
  }

  const [aNovas, aLembrar, aVencidas] = await Promise.all([
    novas(),
    lembretes(),
    vencidas(),
  ]);

  await mandarLote(aNovas, "cobranca_nova", resumo, simular);
  await mandarLote(aLembrar, "cobranca_lembrete", resumo, simular);
  await mandarLote(aVencidas, "cobranca_vencida", resumo, simular);

  const total = aNovas.length + aLembrar.length + aVencidas.length;
  if (total >= LIMITE_POR_EXECUCAO) {
    resumo.detalhes.push(
      `ATENÇÃO: bateu o teto de ${LIMITE_POR_EXECUCAO} por execução. ` +
        `Sobrou fila para amanhã.`,
    );
  }

  return resumo;
}

/**
 * Confirmação de pagamento. Chamada pelo webhook, logo depois da baixa.
 *
 * Nunca lança: o webhook já respondeu 200 ao Asaas quando isto roda, e uma
 * falha de e-mail não pode virar evento "não processado". O envio em si já
 * tem as três tentativas por dentro.
 */
export async function mandarConfirmacao(faturaId: string): Promise<void> {
  await liberarTravadas();

  const f = await faturaPaga(faturaId);
  if (!f) return;

  const html = await render(
    PagamentoConfirmado({
      nome: f.nome,
      numero: f.numero,
      descricao: f.descricao,
      valorCentavos: f.valorCentavos,
      forma: f.formaPagamento,
      url: `${urlBase()}/portal/faturas/${f.id}/recibo`,
    }),
  );

  await enviarUmaVez({
    para: f.email,
    assunto: `Pagamento confirmado — fatura ${f.numero} — courte`,
    html,
    tipo: "pagamento_confirmado",
    clienteId: f.clienteId,
    faturaId: f.id,
  });
}
