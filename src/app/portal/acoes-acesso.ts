"use server";

import { redirect } from "next/navigation";
import { mandarLinkDeAcesso } from "@/lib/link-acesso";
import { normalizarEmail } from "@/lib/senha";

export type EstadoForm = { erro?: string };

const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * As duas telas que pedem link — primeiro acesso e esqueci a senha — fazem
 * a mesma coisa. Muda so qual e-mail sai, e quem decide isso e o estado da
 * conta, dentro de mandarLinkDeAcesso.
 *
 * REGRA QUE MANDA AQUI: a resposta e IDENTICA exista ou nao o e-mail.
 * Mensagem igual, destino igual, e — porque a consulta ao banco roda nos
 * dois caminhos — tempo parecido. Se a tela dissesse "e-mail nao
 * encontrado", qualquer um levantaria a lista de clientes do Guilherme
 * testando endereco por endereco.
 *
 * O unico erro que a tela mostra e formato invalido, que nao revela nada.
 */
async function pedir(
  dados: FormData,
  pedido: "primeiro_acesso" | "recuperar_senha",
): Promise<EstadoForm> {
  const email = normalizarEmail(String(dados.get("email") ?? ""));

  if (!FORMATO_EMAIL.test(email)) {
    return { erro: "Escreva um e-mail válido." };
  }

  await mandarLinkDeAcesso(email, pedido);

  // Fora de qualquer if: mesmo destino nos dois casos.
  redirect(`/portal/verifique-email?e=${encodeURIComponent(email)}`);
}

export async function pedirLinkAcesso(
  _anterior: EstadoForm,
  dados: FormData,
): Promise<EstadoForm> {
  return pedir(dados, "primeiro_acesso");
}

export async function pedirNovaSenha(
  _anterior: EstadoForm,
  dados: FormData,
): Promise<EstadoForm> {
  return pedir(dados, "recuperar_senha");
}
