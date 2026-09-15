"use server";

import { redirect } from "next/navigation";
import { render } from "@react-email/components";
import { acharDestino, criarLink, podePedirLink } from "@/db/tokens";
import { enviarEmail, urlBase } from "@/lib/email";
import { normalizarEmail } from "@/lib/senha";
import { PrimeiroAcesso } from "@/emails/primeiro-acesso";

export type EstadoForm = { erro?: string };

const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Pedido de link de primeiro acesso.
 *
 * REGRA QUE MANDA AQUI: a resposta e IDENTICA exista ou nao o e-mail.
 * Mensagem igual, destino igual, e — por causa da consulta ao banco em
 * ambos os caminhos — tempo parecido. Se a tela dissesse "e-mail nao
 * encontrado", qualquer um descobriria a lista de clientes do Guilherme
 * testando endereco por endereco.
 *
 * O unico erro que a tela mostra e formato invalido, que nao revela nada.
 */
export async function pedirLinkAcesso(
  _anterior: EstadoForm,
  dados: FormData,
): Promise<EstadoForm> {
  const bruto = String(dados.get("email") ?? "");
  const email = normalizarEmail(bruto);

  if (!FORMATO_EMAIL.test(email)) {
    return { erro: "Escreva um e-mail válido." };
  }

  const destino = await acharDestino(email);

  if (destino) {
    // Trava de 60s por conta: impede transformar o formulario em maquina de
    // encher a caixa de entrada de um cliente. Nao protege contra varredura
    // de IP — isso ainda falta, e esta anotado.
    if (await podePedirLink(destino.clienteId, "primeiro_acesso")) {
      const token = await criarLink(
        destino.clienteId,
        destino.usuarioId,
        "primeiro_acesso",
      );

      const html = await render(
        PrimeiroAcesso({
          nome: destino.nome,
          url: `${urlBase()}/portal/criar-senha/${token}`,
          validadeTexto: "1 hora",
        }),
      );

      await enviarEmail({
        para: destino.email,
        assunto: "Seu acesso ao Portal do Cliente — courte",
        html,
        tipo: "primeiro_acesso",
        clienteId: destino.clienteId,
      });
    }
  }

  // Fora do if de proposito: mesmo destino nos dois casos.
  redirect(`/portal/verifique-email?e=${encodeURIComponent(email)}`);
}
