/**
 * Consultas do admin. Tudo aqui pressupoe que quem chamou ja passou por
 * exigirAdmin() — estas funcoes NAO conferem permissao.
 */

import { sql } from "drizzle-orm";
import { consultar, db } from "./index";
import { normalizarEmail } from "@/lib/senha";

export type TipoProduto = "site" | "sistema" | "manutencao";
export type StatusProduto = "ativo" | "pausado" | "encerrado";

export type ClienteResumo = {
  id: string;
  nome: string;
  email: string;
  produtos: number;
  emAberto: number;
  criadoEm: string;
};

export async function listarClientes(): Promise<ClienteResumo[]> {
  return consultar<ClienteResumo>(sql`
    select c.id, c.nome, c.email, c.criado_em as "criadoEm",
           (select count(*)::int from produtos p where p.cliente_id = c.id) as produtos,
           (select count(*)::int from faturas f
             where f.cliente_id = c.id and f.status = 'aberta') as "emAberto"
      from clientes c
     order by c.nome
  `);
}

export type Cliente = {
  id: string;
  nome: string;
  email: string;
  documento: string | null;
  telefone: string | null;
};

export async function lerCliente(id: string): Promise<Cliente | null> {
  const r = await consultar<Cliente>(sql`
    select id, nome, email, documento, telefone from clientes where id = ${id}
  `);
  return r[0] ?? null;
}

export type DadosCliente = {
  nome: string;
  email: string;
  documento: string | null;
  telefone: string | null;
};

export async function criarCliente(d: DadosCliente): Promise<string> {
  const r = await consultar<{ id: string }>(sql`
    insert into clientes (id, nome, email, documento, telefone)
    values (gen_random_uuid()::text, ${d.nome}, ${normalizarEmail(d.email)},
            ${d.documento}, ${d.telefone})
    returning id
  `);
  return r[0].id;
}

export async function atualizarCliente(
  id: string,
  d: DadosCliente,
): Promise<void> {
  await db().execute(sql`
    update clientes
       set nome = ${d.nome}, email = ${normalizarEmail(d.email)},
           documento = ${d.documento}, telefone = ${d.telefone},
           atualizado_em = now()
     where id = ${id}
  `);
}

export type Produto = {
  id: string;
  nome: string;
  descricao: string | null;
  tipo: TipoProduto;
  endereco: string | null;
  mensalidadeCentavos: number | null;
  diaVencimento: number | null;
  status: StatusProduto;
  ativoDesde: string | null;
};

export async function listarProdutos(clienteId: string): Promise<Produto[]> {
  return consultar<Produto>(sql`
    select id, nome, descricao, tipo, endereco,
           mensalidade_centavos as "mensalidadeCentavos",
           dia_vencimento as "diaVencimento",
           status, ativo_desde as "ativoDesde"
      from produtos where cliente_id = ${clienteId}
     order by criado_em
  `);
}

export type DadosProduto = {
  nome: string;
  descricao: string | null;
  tipo: TipoProduto;
  endereco: string | null;
  mensalidadeCentavos: number | null;
  diaVencimento: number | null;
  status: StatusProduto;
  ativoDesde: string | null;
};

export async function criarProduto(
  clienteId: string,
  d: DadosProduto,
): Promise<string> {
  const r = await consultar<{ id: string }>(sql`
    insert into produtos (id, cliente_id, nome, descricao, tipo, endereco,
                          mensalidade_centavos, dia_vencimento, status, ativo_desde)
    values (gen_random_uuid()::text, ${clienteId}, ${d.nome}, ${d.descricao},
            ${d.tipo}, ${d.endereco}, ${d.mensalidadeCentavos},
            ${d.diaVencimento}, ${d.status}, ${d.ativoDesde})
    returning id
  `);
  return r[0].id;
}

export async function atualizarProduto(
  id: string,
  d: DadosProduto,
): Promise<void> {
  await db().execute(sql`
    update produtos
       set nome = ${d.nome}, descricao = ${d.descricao}, tipo = ${d.tipo},
           endereco = ${d.endereco},
           mensalidade_centavos = ${d.mensalidadeCentavos},
           dia_vencimento = ${d.diaVencimento},
           status = ${d.status}, ativo_desde = ${d.ativoDesde}
     where id = ${id}
  `);
}

export type FaturaAdmin = {
  id: string;
  numero: number;
  tipo: "mensalidade" | "avulsa";
  descricao: string;
  valorCentavos: number;
  vencimento: string;
  status: "aberta" | "paga" | "cancelada";
  produtoNome: string | null;
};

export async function listarFaturas(clienteId: string): Promise<FaturaAdmin[]> {
  return consultar<FaturaAdmin>(sql`
    select f.id, f.numero, f.tipo, f.descricao,
           f.valor_centavos as "valorCentavos",
           f.vencimento, f.status, p.nome as "produtoNome"
      from faturas f
      left join produtos p on p.id = f.produto_id
     where f.cliente_id = ${clienteId}
     order by f.vencimento desc, f.numero desc
  `);
}

/** Cobranca avulsa: sempre ligada a um produto, como o ETAPAS.md pede. */
export async function criarCobrancaAvulsa(d: {
  clienteId: string;
  produtoId: string;
  descricao: string;
  valorCentavos: number;
  vencimento: string;
}): Promise<string> {
  const r = await consultar<{ id: string }>(sql`
    insert into faturas (id, cliente_id, produto_id, tipo, descricao,
                         valor_centavos, vencimento)
    values (gen_random_uuid()::text, ${d.clienteId}, ${d.produtoId}, 'avulsa',
            ${d.descricao}, ${d.valorCentavos}, ${d.vencimento})
    returning id
  `);
  return r[0].id;
}
