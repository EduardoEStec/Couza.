import { after } from "next/server";
import {
  faturaPelaCobranca,
  gravarEvento,
  marcarAberta,
  marcarCancelada,
  marcarPaga,
  marcarProcessado,
  type FormaAsaas,
} from "@/db/eventos";
import { mandarConfirmacao } from "@/lib/cobranca-email";

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

/**
 * Mapeamento evento -> status da fatura.
 *
 * A lista de eventos veio da documentacao oficial. ATENCAO ao que NAO esta
 * aqui: quase todo evento so vai para o log. Mexer no status de fatura por
 * palpite e pior do que nao mexer — o cliente ve, e ele confia na tela.
 */

/** O cliente pagou. */
const PAGOU = new Set([
  "PAYMENT_CONFIRMED", // "Pagamento efetuado, mas com saldo ainda nao disponibilizado"
  "PAYMENT_RECEIVED", // "Cobranca recebida, com valor disponivel na conta Asaas"
]);

/**
 * A cobranca volta a ser devida: ela existe e o cliente ainda deve.
 *
 * `RECEIVED_IN_CASH_UNDONE` e "recebimento em dinheiro desfeito" — alguem
 * deu baixa manual por engano e voltou atras. Cancelar seria errado: a
 * divida continua de pe.
 *
 * `RESTORED` e "cobranca restaurada" — uma cobranca removida voltou.
 */
const VOLTOU_A_DEVER = new Set([
  "PAYMENT_RECEIVED_IN_CASH_UNDONE",
  "PAYMENT_RESTORED",
]);

/** A cobranca deixou de existir do lado do Asaas. */
const CANCELOU = new Set([
  "PAYMENT_DELETED", // "Cobranca removida"
]);

/**
 * Eventos que NAO mudam status sozinhos — precisam do Guilherme olhar.
 *
 * Estorno e chargeback mexem em dinheiro que ja entrou, e o que fazer
 * depende do motivo: estornar porque o servico nao foi entregue (cancelar)
 * e diferente de estornar e continuar cobrando. Decidir por palpite aqui
 * seria inventar regra de negocio.
 *
 * Ficam gravados com o motivo, para ele resolver no admin.
 */
const PRECISA_DE_HUMANO = new Set([
  "PAYMENT_REFUNDED",
  "PAYMENT_PARTIALLY_REFUNDED",
  "PAYMENT_REFUND_IN_PROGRESS",
  "PAYMENT_CHARGEBACK_REQUESTED",
  "PAYMENT_CHARGEBACK_DISPUTE",
  "PAYMENT_AWAITING_CHARGEBACK_REVERSAL",
  "PAYMENT_REPROVED_BY_RISK_ANALYSIS",
  "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED",
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

    /**
     * A confirmacao sai AQUI, nao no cron das 9h: a pessoa acabou de pagar
     * e quer saber agora. No intervalo ela fica na duvida, e as vezes paga
     * de novo.
     *
     * Envolvido em try porque e-mail que falha nao pode marcar o evento
     * como nao processado — a baixa da fatura, que e o que importa, ja
     * aconteceu na linha de cima. `enviarUmaVez` impede repeticao mesmo
     * que o Asaas reentregue CONFIRMED e depois RECEIVED da mesma cobranca.
     */
    try {
      await mandarConfirmacao(fatura.id);
    } catch {
      // ver comentario acima
    }
  } else if (VOLTOU_A_DEVER.has(tipo)) {
    await marcarAberta(fatura.id);
  } else if (CANCELOU.has(tipo)) {
    await marcarCancelada(fatura.id);
  } else if (PRECISA_DE_HUMANO.has(tipo)) {
    // De proposito nao mexe no status. Fica marcado para o Guilherme ver.
    await marcarProcessado(
      eventoLinhaId,
      fatura.id,
      "precisa de decisão manual: o status da fatura não foi alterado",
    );
    return;
  }
  // PAYMENT_OVERDUE nao muda nada: "atrasada" e derivada do vencimento,
  // nunca gravada. PAYMENT_CREATED, PAYMENT_UPDATED, os de visualizacao e
  // os de split so ficam no log.

  await marcarProcessado(eventoLinhaId, fatura.id);
}
