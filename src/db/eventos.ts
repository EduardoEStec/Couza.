/**
 * Eventos do Asaas: gravar cru, processar uma vez só.
 *
 * A entrega do Asaas e "pelo menos uma vez" e a documentacao deles diz que
 * "o mesmo evento pode ser enviado mais de uma vez". Toda a idempotencia
 * mora no indice unico de `evento_id`: a segunda chegada do mesmo evento
 * nao insere linha, e portanto nao dispara processamento.
 */

import { sql } from "drizzle-orm";
import { consultar, db } from "./index";

export type Gravado =
  | { novo: true; id: string }
  | { novo: false; motivo: "ja_recebido" };

/**
 * Grava o evento cru. Devolve `novo: false` quando ele ja tinha chegado.
 *
 * O `on conflict do nothing` + `returning` e o que torna isso atomico: duas
 * entregas simultaneas do mesmo evento, so uma recebe linha de volta.
 */
export async function gravarEvento(d: {
  eventoId: string;
  tipo: string;
  payload: unknown;
  asaasCobrancaId: string | null;
}): Promise<Gravado> {
  const r = await consultar<{ id: string }>(sql`
    insert into eventos_asaas (id, evento_id, tipo, payload, asaas_cobranca_id)
    values (
      gen_random_uuid()::text,
      ${d.eventoId},
      ${d.tipo},
      ${JSON.stringify(d.payload)}::jsonb,
      ${d.asaasCobrancaId}
    )
    on conflict (evento_id) do nothing
    returning id
  `);

  return r.length === 1
    ? { novo: true, id: r[0].id }
    : { novo: false, motivo: "ja_recebido" };
}

export async function marcarProcessado(
  id: string,
  faturaId: string | null,
  erro?: string,
): Promise<void> {
  await db().execute(sql`
    update eventos_asaas
       set processado_em = now(),
           fatura_id = ${faturaId},
           erro = ${erro ?? null}
     where id = ${id}
  `);
}

/** Acha a nossa fatura pelo id da cobranca do lado do Asaas. */
export async function faturaPelaCobranca(
  asaasCobrancaId: string,
): Promise<{ id: string; status: string } | null> {
  const r = await consultar<{ id: string; status: string }>(sql`
    select id, status from faturas where asaas_cobranca_id = ${asaasCobrancaId}
  `);
  return r[0] ?? null;
}

export type FormaAsaas = "BOLETO" | "CREDIT_CARD" | "PIX" | "UNDEFINED" | null;

const FORMA = {
  BOLETO: "boleto",
  CREDIT_CARD: "cartao",
  PIX: "pix",
} as const;

/**
 * Marca a fatura como paga.
 *
 * O `and status <> 'paga'` nao e enfeite: se PAYMENT_CONFIRMED e
 * PAYMENT_RECEIVED chegarem para a mesma cobranca — e chegam, sao eventos
 * diferentes do mesmo pagamento — a segunda nao reescreve a data do
 * pagamento nem dispara de novo o que depender disso.
 */
export async function marcarPaga(
  faturaId: string,
  forma: FormaAsaas,
  quando: string | null,
): Promise<boolean> {
  const mapeada =
    forma && forma in FORMA ? FORMA[forma as keyof typeof FORMA] : null;

  const r = await consultar<{ id: string }>(sql`
    update faturas
       set status = 'paga',
           pago_em = coalesce(${quando}::timestamptz, now()),
           forma_pagamento = coalesce(${mapeada}, forma_pagamento)
     where id = ${faturaId} and status <> 'paga'
     returning id
  `);
  return r.length === 1;
}

export async function marcarCancelada(faturaId: string): Promise<boolean> {
  const r = await consultar<{ id: string }>(sql`
    update faturas
       set status = 'cancelada', pago_em = null, forma_pagamento = null
     where id = ${faturaId} and status <> 'cancelada'
     returning id
  `);
  return r.length === 1;
}

/**
 * Devolve a fatura para "em aberto".
 *
 * Usada quando um recebimento e desfeito ou uma cobranca removida e
 * restaurada: a divida volta a existir. Limpa a data e a forma de
 * pagamento, senao a tela mostraria "aberta" com data de pagamento —
 * contradicao que o cliente ve.
 */
export async function marcarAberta(faturaId: string): Promise<boolean> {
  const r = await consultar<{ id: string }>(sql`
    update faturas
       set status = 'aberta', pago_em = null, forma_pagamento = null
     where id = ${faturaId} and status <> 'aberta'
     returning id
  `);
  return r.length === 1;
}
