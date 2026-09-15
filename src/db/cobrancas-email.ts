/**
 * As tres listas que o cron varre todo dia.
 *
 * "Hoje" e calculado em America/Sao_Paulo, nunca em UTC. O cron roda as
 * 12:00 UTC = 09:00 daqui, mesmo dia do calendario — mas depender disso
 * seria depender do horario, e horario muda. `(now() at time zone
 * 'America/Sao_Paulo')::date` nao muda.
 *
 * `vencimento` e `date`, sem hora e sem fuso: dia 10 e dia 10 em qualquer
 * lugar do mundo. Comparar com um instante daria erro de um dia.
 */

import { sql } from "drizzle-orm";
import { consultar } from "./index";

export type FaturaParaEmail = {
  id: string;
  numero: number;
  descricao: string;
  valorCentavos: number;
  vencimento: string;
  clienteId: string;
  nome: string;
  email: string;
};

/**
 * Teto por execucao.
 *
 * O plano free da Resend da 100 e-mails por DIA. 50 aqui deixa folga para
 * link de acesso, recuperacao de senha e confirmacao de pagamento, que
 * saem fora do cron e nao podem ficar sem cota.
 *
 * Tambem segura o custo de CPU: renderizar template e trabalho de CPU, e o
 * plano free do Workers limita CPU por invocacao.
 */
export const LIMITE_POR_EXECUCAO = 50;

const CAMPOS = sql`
  f.id,
  f.numero,
  f.descricao,
  f.valor_centavos as "valorCentavos",
  f.vencimento::text as vencimento,
  c.id as "clienteId",
  c.nome,
  c.email
`;

const HOJE = sql`(now() at time zone 'America/Sao_Paulo')::date`;

/**
 * Nao manda o que ja foi mandado.
 *
 * Isto e conforto, nao garantia: quem impede o envio duplicado de verdade e
 * o indice unico, na hora do insert. Filtrar aqui so evita renderizar
 * template a toa para uma fatura que vai ser descartada adiante.
 */
const jaSaiu = (tipo: string) => sql`
  not exists (
    select 1 from emails_enviados e
     where e.fatura_id = f.id and e.tipo = ${tipo} and e.status = 'enviado'
  )
`;

/**
 * Cobranca nova: fatura aberta que ainda nao foi avisada.
 *
 * A janela de 7 dias existe por um motivo concreto: sem ela, a PRIMEIRA
 * execucao depois de ligar isso dispararia um e-mail para toda fatura em
 * aberto do historico, inclusive as que o Guilherme ja combinou por fora.
 * Cobranca mais velha que uma semana sem aviso e caso para ele resolver na
 * mao, nao para o robo descobrir sozinho.
 */
export function novas(): Promise<FaturaParaEmail[]> {
  return consultar<FaturaParaEmail>(sql`
    select ${CAMPOS}
      from faturas f join clientes c on c.id = f.cliente_id
     where f.status = 'aberta'
       and f.criado_em >= now() - interval '7 days'
       and ${jaSaiu("cobranca_nova")}
     order by f.criado_em
     limit ${LIMITE_POR_EXECUCAO}
  `);
}

/** Lembrete: vence daqui a exatamente 3 dias. */
export function lembretes(): Promise<FaturaParaEmail[]> {
  return consultar<FaturaParaEmail>(sql`
    select ${CAMPOS}
      from faturas f join clientes c on c.id = f.cliente_id
     where f.status = 'aberta'
       and f.vencimento = ${HOJE} + 3
       and ${jaSaiu("cobranca_lembrete")}
     order by f.vencimento
     limit ${LIMITE_POR_EXECUCAO}
  `);
}

/**
 * Vencidas: passou do vencimento e continua aberta.
 *
 * Uma vez so por fatura — decisao do Guilherme em 15/09/2026. Ele conhece
 * os clientes pelo nome; insistir semanalmente por robo soa pior do que uma
 * mensagem dele. A janela de 30 dias tem o mesmo motivo da de 7 acima.
 */
export function vencidas(): Promise<FaturaParaEmail[]> {
  return consultar<FaturaParaEmail>(sql`
    select ${CAMPOS}
      from faturas f join clientes c on c.id = f.cliente_id
     where f.status = 'aberta'
       and f.vencimento < ${HOJE}
       and f.vencimento >= ${HOJE} - 30
       and ${jaSaiu("cobranca_vencida")}
     order by f.vencimento
     limit ${LIMITE_POR_EXECUCAO}
  `);
}

/** Dados para a confirmacao de pagamento, que sai pelo webhook. */
export async function faturaPaga(
  faturaId: string,
): Promise<(FaturaParaEmail & { formaPagamento: string | null }) | null> {
  const r = await consultar<FaturaParaEmail & { formaPagamento: string | null }>(sql`
    select ${CAMPOS}, f.forma_pagamento as "formaPagamento"
      from faturas f join clientes c on c.id = f.cliente_id
     where f.id = ${faturaId}
  `);
  return r[0] ?? null;
}
