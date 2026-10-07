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
import { consultar, db } from "@/db";
import { ErroDefinitivo, tentar } from "@/lib/tentar";

type TipoEmail =
  | "primeiro_acesso"
  | "recuperar_senha"
  | "cobranca"
  | "cobranca_nova"
  | "cobranca_lembrete"
  | "cobranca_vencida"
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

/** Como `ResultadoEnvio`, mais o caso "ja tinha sido enviado, nem tentei". */
export type ResultadoUnico = ResultadoEnvio | { ok: "pulou" };

function remetente(): string {
  const de = process.env.EMAIL_REMETENTE;
  if (!de) {
    throw new Error(
      "EMAIL_REMETENTE nao definida. Precisa ser um endereco no dominio " +
        "verificado na Resend (envio.couza.com.br), nao o dominio raiz.",
    );
  }
  return de;
}

/**
 * Erros que NAO melhoram se repetir, pela tabela oficial da Resend.
 *
 * 400/401/403/404/405/422 sao problema do nosso lado: endereco invalido,
 * chave errada, campo faltando. Repetir e so barulho.
 *
 * A pegadinha e a cota: `daily_quota_exceeded` chega como 429, que em geral
 * vale repetir — mas esperar 1,2s nao devolve cota nenhuma. O limite so
 * reseta amanha, e a execucao de amanha tenta de novo sozinha.
 */
function naoAdiantaRepetir(status: number, codigo: string): boolean {
  if (
    codigo === "daily_quota_exceeded" ||
    codigo === "monthly_quota_exceeded" ||
    codigo === "invalid_idempotent_request"
  ) {
    return true;
  }
  if (status === 409 || status === 429 || status >= 500) return false;
  return true;
}

/**
 * Uma tentativa de POST na Resend.
 *
 * `chaveIdempotencia` e o que torna a repeticao segura: se a tentativa 1
 * entregou de verdade mas a resposta se perdeu no caminho, a tentativa 2
 * com a mesma chave devolve a MESMA resposta sem mandar outro e-mail. A
 * Resend guarda a chave por 24 horas.
 */
async function postarNaResend(
  chave: string,
  corpo: Record<string, unknown>,
  chaveIdempotencia?: string,
): Promise<string> {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${chave}`,
      "Content-Type": "application/json",
      ...(chaveIdempotencia ? { "Idempotency-Key": chaveIdempotencia } : {}),
    },
    body: JSON.stringify(corpo),
  });

  const json = (await r.json().catch(() => ({}))) as {
    id?: string;
    name?: string;
    message?: string;
  };

  if (!r.ok) {
    const mensagem = json.message ?? `HTTP ${r.status}`;
    if (naoAdiantaRepetir(r.status, json.name ?? "")) {
      throw new ErroDefinitivo(mensagem);
    }
    throw new Error(mensagem);
  }

  return json.id ?? "";
}

async function mandar(
  e: Enviar,
  chaveIdempotencia?: string,
): Promise<ResultadoEnvio> {
  const chave = process.env.RESEND_API_KEY;
  if (!chave) return { ok: false, erro: "RESEND_API_KEY nao definida" };

  try {
    const id = await tentar(() =>
      postarNaResend(
        chave,
        { from: remetente(), to: e.para, subject: e.assunto, html: e.html },
        chaveIdempotencia,
      ),
    );
    return { ok: true, id };
  } catch (falha) {
    return {
      ok: false,
      erro: falha instanceof Error ? falha.message : "falha de rede",
    };
  }
}

export async function enviarEmail(e: Enviar): Promise<ResultadoEnvio> {
  const resultado = await mandar(e);

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

/**
 * Manda UMA vez por fatura e por tipo, custe o que custar.
 *
 * Quem garante isso e o indice unico parcial
 * `emails_uma_vez_idx`, no banco
 * — nao um `if`. Mesma regra que ja vale para o webhook do Asaas.
 *
 * A ordem importa e e o contrario da intuicao: a linha e gravada ANTES de
 * chamar a Resend, para RESERVAR a vaga. Duas execucoes simultaneas nao
 * conseguem mandar o mesmo e-mail nem querendo — a segunda perde o insert
 * e vai embora sem tentar.
 *
 * Se o envio falhar de vez, a linha vira 'falhou', o que a tira do indice e
 * LIBERA a vaga: a execucao de amanha tenta de novo.
 *
 * A vaga e reservada como 'enviando', nao como 'enviado'. A diferenca
 * importa: 'enviando' quer dizer "reservei, ainda nao sei o resultado", e e
 * o que permite a `liberarTravadas()` distinguir um processo que morreu no
 * meio de um envio que realmente deu certo. Sem essa separacao, o Worker
 * morrer entre a chamada e o update deixaria a fatura marcada como avisada
 * para sempre, sem nunca ter avisado.
 */
export async function enviarUmaVez(
  e: Enviar & { faturaId: string },
): Promise<ResultadoUnico> {
  const reservadas = await tentar(() =>
    consultar<{ id: string }>(sql`
      insert into emails_enviados
        (id, cliente_id, fatura_id, tipo, destinatario, assunto, status)
      values (
        gen_random_uuid()::text,
        ${e.clienteId ?? null},
        ${e.faturaId},
        ${e.tipo},
        ${e.para},
        ${e.assunto},
        'enviando'
      )
      on conflict do nothing
      returning id
    `),
  );

  if (reservadas.length === 0) return { ok: "pulou" };
  const linha = reservadas[0].id;

  const resultado = await mandar(e, `${e.tipo}/${e.faturaId}`);

  try {
    await consultar(sql`
      update emails_enviados
         set status = ${resultado.ok ? "enviado" : "falhou"},
             resend_id = ${resultado.ok ? resultado.id : null},
             erro = ${resultado.ok ? null : resultado.erro}
       where id = ${linha}
    `);
  } catch {
    // A linha fica presa em 'enviando'. Nao e perda: `liberarTravadas()`
    // solta ela na proxima execucao, e a Idempotency-Key impede que a nova
    // tentativa vire e-mail repetido.
  }

  return resultado;
}

/**
 * Solta as vagas que ficaram presas porque o processo morreu no meio.
 *
 * Uma linha em 'enviando' ha mais de 15 minutos nao e um envio demorado: o
 * envio inteiro tem teto de tres tentativas com 1,6s de espera somada. E um
 * Worker que foi derrubado entre chamar a Resend e anotar o resultado.
 *
 * Soltar e seguro por causa da `Idempotency-Key`: no pior caso — a Resend
 * ACEITOU e nos morremos antes de anotar — a nova tentativa manda a mesma
 * chave `<tipo>/<fatura>`, e a Resend devolve a resposta original sem mandar
 * outro e-mail. A chave vale 24h, e esta varredura roda no comeco de cada
 * execucao do cron e a cada confirmacao de pagamento, muito antes disso.
 *
 * O motivo fica escrito na linha para dar para diferenciar, olhando a
 * tabela, "a Resend recusou" de "o processo morreu".
 */
export async function liberarTravadas(): Promise<number> {
  try {
    const soltas = await consultar<{ id: string }>(sql`
      update emails_enviados
         set status = 'falhou',
             erro = 'processo interrompido antes de confirmar o envio'
       where status = 'enviando'
         and criado_em < now() - interval '15 minutes'
      returning id
    `);
    return soltas.length;
  } catch {
    // Nao pode derrubar a remessa do dia: no pior caso a vaga fica presa
    // mais um dia e a proxima execucao tenta soltar de novo.
    return 0;
  }
}

/** Endereco base do site, para montar links de e-mail. */
export function urlBase(): string {
  return process.env.URL_BASE ?? "http://localhost:3000";
}
