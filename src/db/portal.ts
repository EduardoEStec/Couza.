/**
 * Consultas do portal do cliente.
 *
 * REGRA QUE VALE PARA TODAS: recebem `clienteId` vindo da SESSAO e filtram
 * por ele. Nenhuma funcao daqui aceita um id que veio da URL sem cruzar com
 * o dono — e por isso que ler uma fatura exige os dois ids.
 *
 * "Hoje" e sempre o dia em America/Sao_Paulo, nao em UTC. O banco guarda em
 * UTC, mas uma fatura que vence dia 10 nao pode virar "atrasada" as 21h do
 * dia 9 em Sao Paulo so porque la ja e dia 10.
 */

import { sql } from "drizzle-orm";
import { consultar } from "./index";

/** Dia de hoje no fuso de Sao Paulo, como data de calendario. */
const HOJE = sql`((now() at time zone 'America/Sao_Paulo')::date)`;

export type StatusExibido = "aberta" | "paga" | "atrasada" | "cancelada";

/* ------------------------------------------------------------------ *
 * Meus produtos
 * ------------------------------------------------------------------ */

export type AvulsaDoProduto = {
  id: string;
  descricao: string;
  valorCentavos: number;
  vencimento: string;
  pagoEm: string | null;
  statusExibido: StatusExibido;
};

export type ProdutoDoCliente = {
  id: string;
  nome: string;
  descricao: string | null;
  tipo: "site" | "sistema" | "manutencao";
  status: "ativo" | "pausado" | "encerrado";
  endereco: string | null;
  mensalidadeCentavos: number | null;
  diaVencimento: number | null;
  ativoDesde: string | null;
  proximaCobranca: string | null;
  avulsas: AvulsaDoProduto[];
};

export async function produtosDoCliente(
  clienteId: string,
): Promise<ProdutoDoCliente[]> {
  const produtos = await consultar<Omit<ProdutoDoCliente, "avulsas">>(sql`
    select p.id, p.nome, p.descricao, p.tipo, p.status, p.endereco,
           p.mensalidade_centavos as "mensalidadeCentavos",
           p.dia_vencimento as "diaVencimento",
           p.ativo_desde as "ativoDesde",
           coalesce(
             -- primeiro: a proxima fatura em aberto deste produto
             (select min(f.vencimento) from faturas f
               where f.produto_id = p.id and f.status = 'aberta'
                 and f.vencimento >= ${HOJE}),
             -- se ainda nao existe fatura gerada, calcula pelo dia do contrato
             case
               when p.status = 'ativo' and p.dia_vencimento is not null then
                 case
                   when extract(day from ${HOJE}) <= p.dia_vencimento
                     then make_date(
                       extract(year from ${HOJE})::int,
                       extract(month from ${HOJE})::int,
                       p.dia_vencimento)
                   else (make_date(
                       extract(year from ${HOJE})::int,
                       extract(month from ${HOJE})::int,
                       p.dia_vencimento) + interval '1 month')::date
                 end
             end
           ) as "proximaCobranca"
      from produtos p
     where p.cliente_id = ${clienteId}
     order by
       case p.status when 'ativo' then 0 when 'pausado' then 1 else 2 end,
       p.criado_em
  `);

  if (produtos.length === 0) return [];

  const avulsas = await consultar<AvulsaDoProduto & { produtoId: string }>(sql`
    select f.id, f.produto_id as "produtoId", f.descricao,
           f.valor_centavos as "valorCentavos",
           f.vencimento, f.pago_em as "pagoEm",
           case
             when f.status = 'paga' then 'paga'
             when f.status = 'cancelada' then 'cancelada'
             when f.vencimento < ${HOJE} then 'atrasada'
             else 'aberta'
           end as "statusExibido"
      from faturas f
     where f.cliente_id = ${clienteId}
       and f.tipo = 'avulsa'
       and f.produto_id is not null
     order by f.vencimento desc
  `);

  return produtos.map((p) => ({
    ...p,
    avulsas: avulsas.filter((a) => a.produtoId === p.id),
  }));
}

/* ------------------------------------------------------------------ *
 * Resumo do topo — ETAPAS.md etapa 5
 * ------------------------------------------------------------------ */

export type Resumo = {
  totalMensalCentavos: number;
  atrasadasQtd: number;
  atrasadasCentavos: number;
  aVencerQtd: number;
  aVencerCentavos: number;
};

export async function resumoDoCliente(clienteId: string): Promise<Resumo> {
  const r = await consultar<Resumo>(sql`
    select
      coalesce((select sum(p.mensalidade_centavos) from produtos p
                 where p.cliente_id = ${clienteId} and p.status = 'ativo'), 0)::int
        as "totalMensalCentavos",
      coalesce(count(*) filter (where f.vencimento < ${HOJE}), 0)::int
        as "atrasadasQtd",
      coalesce(sum(f.valor_centavos) filter (where f.vencimento < ${HOJE}), 0)::int
        as "atrasadasCentavos",
      coalesce(count(*) filter (where f.vencimento >= ${HOJE}), 0)::int
        as "aVencerQtd",
      coalesce(sum(f.valor_centavos) filter (where f.vencimento >= ${HOJE}), 0)::int
        as "aVencerCentavos"
      from faturas f
     where f.cliente_id = ${clienteId} and f.status = 'aberta'
  `);
  return r[0];
}

/* ------------------------------------------------------------------ *
 * Faturas
 * ------------------------------------------------------------------ */

export type Filtro = "todas" | "aberta" | "paga" | "atrasada";

export type FaturaDoCliente = {
  id: string;
  numero: number;
  tipo: "mensalidade" | "avulsa";
  descricao: string;
  valorCentavos: number;
  vencimento: string;
  pagoEm: string | null;
  formaPagamento: "cartao" | "pix" | "boleto" | null;
  produtoNome: string | null;
  statusExibido: StatusExibido;
  diasAteVencer: number;
};

export async function faturasDoCliente(
  clienteId: string,
  filtro: Filtro,
): Promise<FaturaDoCliente[]> {
  const todas = await consultar<FaturaDoCliente>(sql`
    select f.id, f.numero, f.tipo, f.descricao,
           f.valor_centavos as "valorCentavos",
           f.vencimento, f.pago_em as "pagoEm",
           f.forma_pagamento as "formaPagamento",
           p.nome as "produtoNome",
           case
             when f.status = 'paga' then 'paga'
             when f.status = 'cancelada' then 'cancelada'
             when f.vencimento < ${HOJE} then 'atrasada'
             else 'aberta'
           end as "statusExibido",
           (f.vencimento - ${HOJE})::int as "diasAteVencer"
      from faturas f
      left join produtos p on p.id = f.produto_id
     where f.cliente_id = ${clienteId}
     order by
       case
         when f.status = 'aberta' and f.vencimento < ${HOJE} then 0
         when f.status = 'aberta' then 1
         else 2
       end,
       f.vencimento desc
  `);

  return filtro === "todas"
    ? todas
    : todas.filter((f) => f.statusExibido === filtro);
}

/**
 * Uma fatura, SÓ se for do cliente da sessao.
 *
 * Os dois ids no where sao a defesa: o id da URL sozinho abriria a fatura
 * de qualquer um que soubesse adivinhar um uuid. E o uuid e aleatorio
 * justamente para ninguem adivinhar — mas defesa em profundidade e barata.
 */
export async function faturaDoCliente(
  clienteId: string,
  faturaId: string,
): Promise<FaturaDoCliente | null> {
  const r = await consultar<FaturaDoCliente>(sql`
    select f.id, f.numero, f.tipo, f.descricao,
           f.valor_centavos as "valorCentavos",
           f.vencimento, f.pago_em as "pagoEm",
           f.forma_pagamento as "formaPagamento",
           p.nome as "produtoNome",
           case
             when f.status = 'paga' then 'paga'
             when f.status = 'cancelada' then 'cancelada'
             when f.vencimento < ${HOJE} then 'atrasada'
             else 'aberta'
           end as "statusExibido",
           (f.vencimento - ${HOJE})::int as "diasAteVencer"
      from faturas f
      left join produtos p on p.id = f.produto_id
     where f.id = ${faturaId} and f.cliente_id = ${clienteId}
  `);
  return r[0] ?? null;
}

/** Dados do cliente para o recibo. */
export async function dadosParaRecibo(clienteId: string): Promise<{
  nome: string;
  documento: string | null;
}> {
  const r = await consultar<{ nome: string; documento: string | null }>(sql`
    select nome, documento from clientes where id = ${clienteId}
  `);
  return r[0];
}
