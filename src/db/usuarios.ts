/**
 * Consultas de autenticacao.
 *
 * O bcrypt roda AQUI, no Postgres, via pgcrypto — ver o comentario de
 * src/lib/senha.ts para o porque. O Worker manda o pre-hash (SHA-256) e le
 * de volta um booleano.
 *
 * REGRA QUE NAO SE QUEBRA: a senha (nem o pre-hash) nunca entra em log,
 * nunca e interpolada dentro da string de SQL, e nunca sai daqui numa
 * mensagem de erro. Sempre parametro.
 */

import { sql } from "drizzle-orm";
import { consultar, db } from "./index";
import { preHash, normalizarEmail } from "@/lib/senha";

/** Custo do bcrypt. 12 leva ~250ms no Neon: irrelevante para um login por
 *  dia, e caro o bastante para inviabilizar quebra em massa se o banco vazar. */
const CUSTO_BCRYPT = 12;

/** Falhas seguidas antes de travar a conta. */
const MAX_TENTATIVAS = 5;

/** Curto de proposito: quem souber o e-mail consegue travar a conta alheia,
 *  e uma janela longa transformaria isso em negacao de servico barata. */
const BLOQUEIO_MINUTOS = 15;

export type ResultadoLogin =
  | { situacao: "sem_conta" }
  | { situacao: "bloqueada" }
  | { situacao: "sem_senha"; usuarioId: string }
  | { situacao: "senha_errada"; usuarioId: string }
  | { situacao: "ok"; usuarioId: string; clienteId: string };

/**
 * Confere e-mail + senha.
 *
 * O `case` nao e enfeite: ele garante que o `crypt()` NAO seja avaliado
 * quando a conta esta travada. Sem isso, uma enxurrada de tentativas contra
 * uma conta ja bloqueada continuaria queimando CPU do Neon a cada requisicao
 * — o bloqueio protegeria a senha, mas nao o banco.
 */
export async function verificarLogin(
  email: string,
  senha: string,
): Promise<ResultadoLogin> {
  const alvo = normalizarEmail(email);
  const ph = await preHash(senha);

  const linhas = await consultar<{
    id: string;
    cliente_id: string;
    tem_senha: boolean;
    travada: boolean;
    confere: boolean | null;
  }>(sql`
    select u.id,
           u.cliente_id,
           u.senha_hash is not null as tem_senha,
           (u.bloqueado_ate is not null and u.bloqueado_ate > now()) as travada,
           case
             when u.senha_hash is null then null
             when u.bloqueado_ate is not null and u.bloqueado_ate > now() then null
             else u.senha_hash = crypt(${ph}, u.senha_hash)
           end as confere
      from usuarios u
     where u.email = ${alvo} and u.ativo
  `);

  if (linhas.length === 0) {
    /**
     * E-mail inexistente responderia em milissegundos, enquanto um que
     * existe leva os ~250ms do bcrypt — e so essa diferenca de tempo ja
     * revela quais e-mails tem conta. Este hash de descarte iguala os dois.
     * gen_salt em vez de um hash fixo: custa o mesmo e nao depende de um
     * literal de 60 caracteres continuar valido.
     */
    await db().execute(
      sql`select crypt(${ph}, gen_salt('bf', ${CUSTO_BCRYPT}))`,
    );
    return { situacao: "sem_conta" };
  }

  const u = linhas[0];
  if (u.travada) return { situacao: "bloqueada" };
  if (!u.tem_senha) return { situacao: "sem_senha", usuarioId: u.id };
  if (u.confere !== true) return { situacao: "senha_errada", usuarioId: u.id };
  return { situacao: "ok", usuarioId: u.id, clienteId: u.cliente_id };
}

/**
 * Conta uma falha e trava a conta ao atingir o teto.
 *
 * Contador e prazo sao decididos no MESMO update, lendo a propria coluna em
 * vez de um valor vindo do JavaScript: duas tentativas simultaneas leriam
 * ambas `tentativas = 3`, gravariam ambas `4`, e a trava nunca chegaria.
 */
export async function registrarFalha(usuarioId: string): Promise<void> {
  await db().execute(sql`
    update usuarios
       set tentativas = tentativas + 1,
           bloqueado_ate = case
             when tentativas + 1 >= ${MAX_TENTATIVAS}
               then now() + make_interval(mins => ${BLOQUEIO_MINUTOS})
             else bloqueado_ate
           end,
           atualizado_em = now()
     where id = ${usuarioId}
  `);
}

/** Zera o contador depois de um acerto. */
export async function limparTentativas(usuarioId: string): Promise<void> {
  await db().execute(sql`
    update usuarios
       set tentativas = 0, bloqueado_ate = null, atualizado_em = now()
     where id = ${usuarioId}
  `);
}

/**
 * Grava a senha. Recebe a senha crua, aplica o pre-hash aqui e deixa o
 * bcrypt para o Postgres. Zera a trava: criar senha nova destrava a conta.
 */
export async function definirSenha(
  usuarioId: string,
  senha: string,
): Promise<void> {
  const ph = await preHash(senha);
  await db().execute(sql`
    update usuarios
       set senha_hash = crypt(${ph}, gen_salt('bf', ${CUSTO_BCRYPT})),
           tentativas = 0,
           bloqueado_ate = null,
           atualizado_em = now()
     where id = ${usuarioId}
  `);
}
