"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  atualizarCliente,
  atualizarProduto,
  criarCliente,
  criarCobrancaAvulsa,
  criarProduto,
  type StatusProduto,
  type TipoProduto,
} from "@/db/admin";
import { abrirSessaoAdmin, conferirAdmin, exigirAdmin, sairAdmin } from "@/lib/admin";
import { paraCentavos } from "@/lib/dinheiro";
import {
  sincronizarAssinatura,
  sincronizarCliente,
  sincronizarCobranca,
} from "@/db/asaas-sync";

export type Estado = { erro?: string; aviso?: string; ok?: boolean };

/* --- acesso -------------------------------------------------------- */

export async function entrarAdmin(
  _anterior: Estado,
  dados: FormData,
): Promise<Estado> {
  const email = String(dados.get("email") ?? "");
  const senha = String(dados.get("senha") ?? "");

  if (!(await conferirAdmin(email, senha))) {
    return { erro: "E-mail ou senha incorretos." };
  }
  await abrirSessaoAdmin();
  redirect("/admin");
}

export async function sairDoAdmin(): Promise<void> {
  await sairAdmin();
  redirect("/admin/login");
}

/* --- clientes ------------------------------------------------------ */

function textoOuNulo(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

export async function salvarCliente(
  _anterior: Estado,
  dados: FormData,
): Promise<Estado> {
  await exigirAdmin();

  const id = textoOuNulo(dados.get("id"));
  const nome = String(dados.get("nome") ?? "").trim();
  const email = String(dados.get("email") ?? "").trim();

  if (nome === "") return { erro: "O nome é obrigatório." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return { erro: "E-mail inválido." };
  }

  const d = {
    nome,
    email,
    documento: textoOuNulo(dados.get("documento")),
    telefone: textoOuNulo(dados.get("telefone")),
  };

  try {
    if (id) {
      await atualizarCliente(id, d);
      const s = await sincronizarCliente(id);
      revalidatePath(`/admin/clientes/${id}`);
      return s.ok ? { ok: true } : { aviso: s.aviso };
    }
    const novo = await criarCliente(d);
    await sincronizarCliente(novo);
    redirect(`/admin/clientes/${novo}`);
  } catch (e) {
    // O unico erro esperado aqui e e-mail repetido, que tem indice unico.
    if (e instanceof Error && /duplicate key|unique/i.test(e.message)) {
      return { erro: "Já existe cliente com esse e-mail." };
    }
    throw e;
  }
}

/* --- produtos ------------------------------------------------------ */

export async function salvarProduto(
  _anterior: Estado,
  dados: FormData,
): Promise<Estado> {
  await exigirAdmin();

  const id = textoOuNulo(dados.get("id"));
  const clienteId = String(dados.get("clienteId") ?? "");
  const nome = String(dados.get("nome") ?? "").trim();
  if (nome === "") return { erro: "O nome do produto é obrigatório." };

  const mensalidadeTexto = String(dados.get("mensalidade") ?? "").trim();
  const mensalidadeCentavos =
    mensalidadeTexto === "" ? null : paraCentavos(mensalidadeTexto);
  if (mensalidadeTexto !== "" && mensalidadeCentavos === null) {
    return { erro: "Mensalidade inválida. Use 250,00 por exemplo." };
  }

  const diaTexto = String(dados.get("diaVencimento") ?? "").trim();
  const diaVencimento = diaTexto === "" ? null : Number(diaTexto);
  if (
    diaVencimento !== null &&
    (!Number.isInteger(diaVencimento) || diaVencimento < 1 || diaVencimento > 28)
  ) {
    // Ate 28 de proposito: dia 29, 30 e 31 nao existem em todo mes, e a
    // regra de "empurra para o ultimo dia" e decisao do Guilherme, nao minha.
    return { erro: "Dia de vencimento deve ser de 1 a 28." };
  }

  const d = {
    nome,
    descricao: textoOuNulo(dados.get("descricao")),
    tipo: String(dados.get("tipo") ?? "site") as TipoProduto,
    endereco: textoOuNulo(dados.get("endereco")),
    mensalidadeCentavos,
    diaVencimento,
    status: String(dados.get("status") ?? "ativo") as StatusProduto,
    ativoDesde: textoOuNulo(dados.get("ativoDesde")),
  };

  let produtoId = id;
  if (id) await atualizarProduto(id, d);
  else produtoId = await criarProduto(clienteId, d);

  const s = await sincronizarAssinatura(produtoId!);
  revalidatePath(`/admin/clientes/${clienteId}`);
  return s.ok ? { ok: true } : { aviso: s.aviso };
}

/* --- cobranca avulsa ----------------------------------------------- */

export async function lancarCobranca(
  _anterior: Estado,
  dados: FormData,
): Promise<Estado> {
  await exigirAdmin();

  const clienteId = String(dados.get("clienteId") ?? "");
  const produtoId = String(dados.get("produtoId") ?? "");
  const descricao = String(dados.get("descricao") ?? "").trim();
  const vencimento = String(dados.get("vencimento") ?? "").trim();

  if (produtoId === "") return { erro: "Escolha o produto." };
  if (descricao === "") return { erro: "Descreva a cobrança." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(vencimento)) {
    return { erro: "Informe o vencimento." };
  }

  const valorCentavos = paraCentavos(String(dados.get("valor") ?? ""));
  if (valorCentavos === null || valorCentavos <= 0) {
    return { erro: "Valor inválido. Use 40,00 por exemplo." };
  }

  const faturaId = await criarCobrancaAvulsa({
    clienteId,
    produtoId,
    descricao,
    valorCentavos,
    vencimento,
  });

  const s = await sincronizarCobranca(faturaId);
  revalidatePath(`/admin/clientes/${clienteId}`);
  return s.ok ? { ok: true } : { aviso: s.aviso };
}
