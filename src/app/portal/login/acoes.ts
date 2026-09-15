"use server";

import { redirect } from "next/navigation";
import {
  limparTentativas,
  registrarFalha,
  verificarLogin,
} from "@/db/usuarios";
import { entrar, sair } from "@/lib/sessao";
import { normalizarEmail } from "@/lib/senha";
import { destinoDoLogin } from "@/lib/destino-login";

export type EstadoForm = { erro?: string };

const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Mensagem unica para conta inexistente, conta sem senha e senha errada.
 *
 * Diferenciar ajudaria o usuario honesto e entregaria a lista de clientes a
 * qualquer um que testasse endereco por endereco. A tela de primeiro acesso
 * resolve o caso legitimo de "ainda nao tenho senha".
 */
const GENERICA = "E-mail ou senha incorretos.";


export async function entrarNoPortal(
  _anterior: EstadoForm,
  dados: FormData,
): Promise<EstadoForm> {
  const email = normalizarEmail(String(dados.get("email") ?? ""));
  const senha = String(dados.get("senha") ?? "");

  if (!FORMATO_EMAIL.test(email) || senha.length === 0) {
    return { erro: GENERICA };
  }

  const r = await verificarLogin(email, senha);

  switch (r.situacao) {
    case "ok":
      await limparTentativas(r.usuarioId);
      await entrar(r.usuarioId);
      redirect(destinoDoLogin(String(dados.get("voltar") ?? "")));

    case "bloqueada":
      /**
       * Este e o unico caso em que a mensagem admite que a conta existe, e e
       * escolha consciente: sem ela, quem digitou a senha CERTA depois de
       * cinco erros ouviria "senha incorreta" para sempre, sem entender nada,
       * e ligaria para o Guilherme. O custo e que alguem descobre se um
       * e-mail e cliente gastando cinco tentativas nele.
       */
      return {
        erro:
          "Muitas tentativas seguidas. Por segurança, espere 15 minutos " +
          "antes de tentar de novo — ou crie uma senha nova em “Esqueci minha senha”.",
      };

    case "senha_errada":
      await registrarFalha(r.usuarioId);
      return { erro: GENERICA };

    case "sem_senha":
    case "sem_conta":
      return { erro: GENERICA };
  }
}

export async function sairDoPortal(): Promise<void> {
  await sair();
  redirect("/portal/login");
}
