"use server";

import { redirect } from "next/navigation";
import { conferirLink, consumirLink, garantirUsuario } from "@/db/tokens";
import { apagarSessoesDoUsuario } from "@/db/sessoes";
import { definirSenha } from "@/db/usuarios";
import { entrar } from "@/lib/sessao";
import { senhaInvalida } from "@/lib/senha";

export type EstadoForm = { erro?: string };

/**
 * Cria a senha a partir do link e ja entra logado.
 *
 * Ordem importa: consumir o link ANTES de gravar a senha. Se gravasse
 * primeiro e o consumo falhasse (outra aba ganhou a corrida), a senha teria
 * mudado por um link que nao valia mais.
 */
export async function criarSenhaComToken(
  _anterior: EstadoForm,
  dados: FormData,
): Promise<EstadoForm> {
  const token = String(dados.get("token") ?? "");
  const senha = String(dados.get("senha") ?? "");
  const confirmar = String(dados.get("confirmar") ?? "");

  const problema = senhaInvalida(senha);
  if (problema) return { erro: problema };
  if (senha !== confirmar) return { erro: "As duas senhas não são iguais." };

  const link = await conferirLink(token);
  if (!link.valido) {
    return {
      erro:
        link.motivo === "expirado"
          ? "Este link expirou. Peça um novo na tela de primeiro acesso."
          : "Este link não vale mais. Peça um novo na tela de primeiro acesso.",
    };
  }

  if (!(await consumirLink(link.tokenId))) {
    return { erro: "Este link acabou de ser usado. Peça um novo." };
  }

  const usuarioId =
    link.usuarioId ?? (await garantirUsuario(link.clienteId, link.email));

  await definirSenha(usuarioId, senha);

  // Trocar a senha derruba o que estava aberto em outro lugar.
  await apagarSessoesDoUsuario(usuarioId);
  await entrar(usuarioId);

  redirect("/portal");
}
