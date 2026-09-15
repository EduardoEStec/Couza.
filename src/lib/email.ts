/**
 * Envio de e-mail pela Resend, com registro no proprio banco.
 *
 * O registro existe porque o plano gratuito da Resend guarda historico por
 * 30 dias. Se daqui a tres meses um cliente disser que nunca recebeu a
 * cobranca, a prova precisa estar aqui, nao la.
 *
 * REGRA: o corpo do e-mail nao vai para o log, nem a senha, nem o token.
 * O que se registra e: para quem, qual tipo, quando, e o id da Resend.
 */

import { sql } from "drizzle-orm";
import { db } from "@/db";

type TipoEmail =
  | "primeiro_acesso"
  | "recuperar_senha"
  | "cobranca"
  | "pagamento_confirmado";

export type Enviar = {
  para: string;
  assunto: string;
  html: string;
  tipo: TipoEmail;
  clienteId?: string | null;
  faturaId?: string | null;
};

export type ResultadoEnvio =
  | { ok: true; id: string }
  | { ok: false; erro: string };

function remetente(): string {
  const de = process.env.EMAIL_REMETENTE;
  if (!de) {
    throw new Error(
      "EMAIL_REMETENTE nao definida. Precisa ser um endereco no dominio " +
        "verificado na Resend (envio.courte.com.br), nao o dominio raiz.",
    );
  }
  return de;
}

export async function enviarEmail(e: Enviar): Promise<ResultadoEnvio> {
  const chave = process.env.RESEND_API_KEY;
  if (!chave) return { ok: false, erro: "RESEND_API_KEY nao definida" };

  let resultado: ResultadoEnvio;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${chave}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: remetente(),
        to: e.para,
        subject: e.assunto,
        html: e.html,
      }),
    });

    const corpo = (await r.json()) as { id?: string; message?: string };
    resultado = r.ok
      ? { ok: true, id: corpo.id ?? "" }
      : { ok: false, erro: corpo.message ?? `HTTP ${r.status}` };
  } catch (falha) {
    resultado = {
      ok: false,
      erro: falha instanceof Error ? falha.message : "falha de rede",
    };
  }

  // O registro nunca derruba o envio: se o banco falhar aqui, o e-mail ja saiu.
  try {
    await db().execute(sql`
      insert into emails_enviados
        (id, cliente_id, fatura_id, tipo, destinatario, assunto, status, resend_id, erro)
      values (
        gen_random_uuid()::text,
        ${e.clienteId ?? null},
        ${e.faturaId ?? null},
        ${e.tipo},
        ${e.para},
        ${e.assunto},
        ${resultado.ok ? "enviado" : "falhou"},
        ${resultado.ok ? resultado.id : null},
        ${resultado.ok ? null : resultado.erro}
      )
    `);
  } catch {
    // silencio proposital: perder o registro e ruim, perder o envio e pior
  }

  return resultado;
}

/** Endereco base do site, para montar links de e-mail. */
export function urlBase(): string {
  return process.env.URL_BASE ?? "http://localhost:3000";
}
