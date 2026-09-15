/**
 * Consultas do checkout. Todas cruzam o cliente da SESSAO com o id da URL.
 */

import { sql } from "drizzle-orm";
import { consultar } from "./index";

export type Pagador = {
  nome: string;
  email: string;
  documento: string;
  telefone: string | null;
  asaasCobrancaId: string | null;
};

export async function dadosDoPagador(
  clienteId: string,
  faturaId: string,
): Promise<Pagador | null> {
  const r = await consultar<Pagador>(sql`
    select c.nome, c.email, c.documento, c.telefone,
           f.asaas_cobranca_id as "asaasCobrancaId"
      from faturas f join clientes c on c.id = f.cliente_id
     where f.id = ${faturaId} and f.cliente_id = ${clienteId}
  `);
  return r[0] ?? null;
}

/**
 * Baixa local, logo depois do cartao aprovar.
 *
 * O webhook tambem vai marcar, e vai chegar depois. A trava `status <>
 * 'paga'` faz a segunda passagem nao reescrever a data. Marcar aqui existe
 * porque o cliente volta para o portal em segundos e nao pode ver "em
 * aberto" logo depois de pagar.
 */
export async function marcarPagaLocal(
  faturaId: string,
  forma: "cartao" | "pix" | "boleto",
): Promise<void> {
  await consultar(sql`
    update faturas
       set status = 'paga', pago_em = now(), forma_pagamento = ${forma}
     where id = ${faturaId} and status <> 'paga'
  `);
}
