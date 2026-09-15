import { after } from "next/server";
import {
  faturaPelaCobranca,
  gravarEvento,
  marcarCancelada,
  marcarPaga,
  marcarProcessado,
  type FormaAsaas,
} from "@/db/eventos";

/**
 * Endpoint de webhook do Asaas.
 *
 * O desenho segue o que a documentacao deles pede, e cada pedaco tem um
 * motivo:
 *
 * 1. CONFERIR O TOKEN — o Asaas manda o authToken configurado no header
 *    `asaas-access-token`. Sem essa checagem, qualquer um na internet
 *    marcaria faturas como pagas mandando um POST.
 *
 * 2. GRAVAR CRU E RESPONDER 200 RAPIDO — "Nao aguarde processamentos
 *    demorados para responder ao Asaas". Depois de 15 falhas seguidas eles
 *    INTERROMPEM a fila, e aí para de chegar tudo, nao so o que falhou.
 *
 * 3. PROCESSAR DEPOIS DA RESPOSTA — `after()` roda com a resposta ja
 *    enviada. Se o processamento falhar, o evento continua gravado e o
 *    erro fica na linha, para resolver sem perder nada.
 *
 * 4. IDEMPOTENCIA — "o mesmo evento pode ser enviado mais de uma vez".
 *    Quem garante e o indice unico de evento_id, no banco, nao um `if`.
 */

/** Eventos que significam "o cliente pagou". */
const PAGOU = new Set([
  "PAYMENT_CONFIRMED", // pago; o dinheiro ainda nao caiu na conta
  "PAYMENT_RECEIVED", // recebido, dinheiro creditado
  "PAYMENT_RECEIVED_IN_CASH", // baixa manual em dinheiro
]);

/** Eventos que desfazem a cobranca. */
const DESFEZ = new Set([
  "PAYMENT_REFUNDED",
  "PAYMENT_DELETED",
  "PAYMENT_CHARGEBACK_REQUESTED",
]);

type CorpoWebhook = {
  id?: string;
  event?: string;
  dateCreated?: string;
  payment?: {
    id?: string;
    status?: string;
    billingType?: string;
    paymentDate?: string;
    confirmedDate?: string;
    clientPaymentDate?: string;
  };
};

function tokenConfere(recebido: string | null): boolean {
  const esperado = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!esperado || !recebido) return false;
  if (esperado.length !== recebido.length) return false;
  // Comparacao de tempo constante.
  let d = 0;
  for (let i = 0; i < esperado.length; i++) {
    d |= esperado.charCodeAt(i) ^ recebido.charCodeAt(i);
  }
  return d === 0;
}

export async function POST(req: Request): Promise<Response> {
  if (!tokenConfere(req.headers.get("asaas-access-token"))) {
    // 401 de proposito: o Asaas so considera entregue com 200, entao ele
    // vai reentregar. Se for alguem se passando pelo Asaas, nunca passa.
    return new Response("nao autorizado", { status: 401 });
  }

  let corpo: CorpoWebhook;
  try {
    corpo = (await req.json()) as CorpoWebhook;
  } catch {
    return new Response("corpo invalido", { status: 400 });
  }

  const eventoId = corpo.id;
  const tipo = corpo.event;
  if (!eventoId || !tipo) {
    return new Response("evento sem id ou sem tipo", { status: 400 });
  }

  const cobrancaId = corpo.payment?.id ?? null;

  const gravado = await gravarEvento({
    eventoId,
    tipo,
    payload: corpo,
    asaasCobrancaId: cobrancaId,
  });

  // Repetido: ja foi processado antes. 200 para o Asaas parar de reenviar.
  if (!gravado.novo) {
    return Response.json({ recebido: true, repetido: true });
  }

  after(async () => {
    try {
      await processar(gravado.id, tipo, corpo);
    } catch (e) {
      await marcarProcessado(
        gravado.id,
        null,
        e instanceof Error ? e.message : "falha desconhecida",
      );
    }
  });

  return Response.json({ recebido: true });
}

async function processar(
  eventoLinhaId: string,
  tipo: string,
  corpo: CorpoWebhook,
): Promise<void> {
  const cobrancaId = corpo.payment?.id;
  if (!cobrancaId) {
    await marcarProcessado(eventoLinhaId, null, "evento sem payment.id");
    return;
  }

  const fatura = await faturaPelaCobranca(cobrancaId);
  if (!fatura) {
    // Acontece de verdade: cobranca criada direto no painel do Asaas, que
    // nao tem correspondente aqui. Nao e erro — e so nao ter o que fazer.
    await marcarProcessado(eventoLinhaId, null, "cobranca sem fatura nossa");
    return;
  }

  if (PAGOU.has(tipo)) {
    const quando =
      corpo.payment?.paymentDate ??
      corpo.payment?.confirmedDate ??
      corpo.payment?.clientPaymentDate ??
      null;
    await marcarPaga(
      fatura.id,
      (corpo.payment?.billingType ?? null) as FormaAsaas,
      quando,
    );
  } else if (DESFEZ.has(tipo)) {
    await marcarCancelada(fatura.id);
  }
  // PAYMENT_OVERDUE nao muda nada: "atrasada" e derivada do vencimento,
  // nunca gravada. PAYMENT_CREATED e PAYMENT_UPDATED so ficam no log.

  await marcarProcessado(eventoLinhaId, fatura.id);
}
