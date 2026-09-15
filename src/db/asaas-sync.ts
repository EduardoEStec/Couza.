/**
 * Ponte entre o nosso banco e o Asaas.
 *
 * O resto do sistema nao chama o Asaas direto — fala com estas funcoes, que
 * decidem o que sincronizar e guardam os ids dos dois lados.
 *
 * REGRA DE FALHA: o registro local SEMPRE é salvo primeiro, e a falha de
 * sincronização nunca desfaz isso. Se o Asaas estiver fora do ar, o
 * Guilherme continua cadastrando; o que falta sincronizar fica visível e
 * pode ser refeito. O contrário — perder o cadastro porque um terceiro caiu
 * — seria pior.
 */

import { sql } from "drizzle-orm";
import { consultar, db } from "./index";
import {
  atualizarClienteAsaas,
  criarAssinatura,
  criarClienteAsaas,
  criarCobranca,
  mensagemDoErro,
  podeSincronizar,
} from "@/lib/asaas";

export type Sincronizacao =
  | { ok: true }
  | { ok: false; aviso: string };

/**
 * Cria ou atualiza o cliente no Asaas e guarda o id deles.
 *
 * Sem CPF/CNPJ nao ha o que fazer: o campo e obrigatorio la e opcional
 * aqui. A tela avisa em vez de estourar.
 */
export async function sincronizarCliente(
  clienteId: string,
): Promise<Sincronizacao> {
  const r = await consultar<{
    nome: string;
    email: string;
    documento: string | null;
    telefone: string | null;
    asaasClienteId: string | null;
  }>(sql`
    select nome, email, documento, telefone,
           asaas_cliente_id as "asaasClienteId"
      from clientes where id = ${clienteId}
  `);
  const c = r[0];
  if (!c) return { ok: false, aviso: "Cliente não encontrado." };

  if (!podeSincronizar(c.documento)) {
    return {
      ok: false,
      aviso:
        "Cliente salvo, mas não foi enviado ao Asaas: falta o CPF/CNPJ, " +
        "que lá é obrigatório. Preencha e salve de novo.",
    };
  }

  try {
    const dados = {
      nome: c.nome,
      documento: c.documento!,
      email: c.email,
      telefone: c.telefone,
      referencia: clienteId,
    };

    const asaas = c.asaasClienteId
      ? await atualizarClienteAsaas(c.asaasClienteId, dados)
      : await criarClienteAsaas(dados);

    if (!c.asaasClienteId) {
      await db().execute(sql`
        update clientes set asaas_cliente_id = ${asaas.id}, atualizado_em = now()
         where id = ${clienteId}
      `);
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, aviso: `Cliente salvo, mas ${mensagemDoErro(e)}` };
  }
}

/**
 * Cria a assinatura recorrente da mensalidade.
 *
 * So faz sentido para produto ATIVO, com mensalidade e com dia de
 * vencimento. Produto sem mensalidade (projeto fechado) nao tem assinatura.
 */
export async function sincronizarAssinatura(
  produtoId: string,
): Promise<Sincronizacao> {
  const r = await consultar<{
    nome: string;
    status: string;
    mensalidadeCentavos: number | null;
    diaVencimento: number | null;
    asaasAssinaturaId: string | null;
    asaasClienteId: string | null;
  }>(sql`
    select p.nome, p.status,
           p.mensalidade_centavos as "mensalidadeCentavos",
           p.dia_vencimento as "diaVencimento",
           p.asaas_assinatura_id as "asaasAssinaturaId",
           c.asaas_cliente_id as "asaasClienteId"
      from produtos p join clientes c on c.id = p.cliente_id
     where p.id = ${produtoId}
  `);
  const p = r[0];
  if (!p) return { ok: false, aviso: "Produto não encontrado." };

  if (p.asaasAssinaturaId) return { ok: true };
  if (p.status !== "ativo") return { ok: true };
  if (p.mensalidadeCentavos == null || p.diaVencimento == null) return { ok: true };

  if (!p.asaasClienteId) {
    return {
      ok: false,
      aviso:
        "Produto salvo, mas a assinatura não foi criada: o cliente ainda " +
        "não está no Asaas. Preencha o CPF/CNPJ e salve o cliente primeiro.",
    };
  }

  try {
    const assinatura = await criarAssinatura({
      clienteAsaasId: p.asaasClienteId,
      valorCentavos: p.mensalidadeCentavos,
      proximoVencimento: proximoDia(p.diaVencimento),
      descricao: p.nome,
      referencia: produtoId,
    });
    await db().execute(sql`
      update produtos set asaas_assinatura_id = ${assinatura.id} where id = ${produtoId}
    `);
    return { ok: true };
  } catch (e) {
    return { ok: false, aviso: `Produto salvo, mas ${mensagemDoErro(e)}` };
  }
}

/** Cria a cobranca avulsa no Asaas e guarda o id. */
export async function sincronizarCobranca(
  faturaId: string,
): Promise<Sincronizacao> {
  const r = await consultar<{
    descricao: string;
    valorCentavos: number;
    vencimento: string;
    asaasCobrancaId: string | null;
    asaasClienteId: string | null;
  }>(sql`
    select f.descricao, f.valor_centavos as "valorCentavos", f.vencimento,
           f.asaas_cobranca_id as "asaasCobrancaId",
           c.asaas_cliente_id as "asaasClienteId"
      from faturas f join clientes c on c.id = f.cliente_id
     where f.id = ${faturaId}
  `);
  const f = r[0];
  if (!f) return { ok: false, aviso: "Fatura não encontrada." };
  if (f.asaasCobrancaId) return { ok: true };

  if (!f.asaasClienteId) {
    return {
      ok: false,
      aviso:
        "Cobrança lançada, mas não foi enviada ao Asaas: o cliente ainda " +
        "não está lá. Preencha o CPF/CNPJ e salve o cliente.",
    };
  }

  try {
    const cobranca = await criarCobranca({
      clienteAsaasId: f.asaasClienteId,
      valorCentavos: f.valorCentavos,
      vencimento: f.vencimento.slice(0, 10),
      descricao: f.descricao,
      referencia: faturaId,
    });
    await db().execute(sql`
      update faturas set asaas_cobranca_id = ${cobranca.id} where id = ${faturaId}
    `);
    return { ok: true };
  } catch (e) {
    return { ok: false, aviso: `Cobrança lançada, mas ${mensagemDoErro(e)}` };
  }
}

/**
 * Proxima ocorrencia de um dia do mes, em America/Sao_Paulo.
 * Se o dia ja passou neste mes, vai para o mes que vem.
 */
function proximoDia(dia: number): string {
  const agora = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }),
  );
  const ano = agora.getFullYear();
  const mes = agora.getMonth();
  const alvo =
    agora.getDate() <= dia
      ? new Date(Date.UTC(ano, mes, dia))
      : new Date(Date.UTC(ano, mes + 1, dia));
  return alvo.toISOString().slice(0, 10);
}
