/**
 * Sessoes — as consultas.
 *
 * NAO e JWT de proposito: um JWT assinado nao da para revogar antes de
 * vencer, e "tirar o acesso de alguem agora" e o caso que mais importa num
 * portal com fatura. O custo e uma consulta por requisicao protegida.
 *
 * O cookie carrega o token cru; aqui fica so o SHA-256 dele.
 */

import { sql } from "drizzle-orm";
import { consultar, db } from "./index";
import {
  expiraEm,
  gerarToken,
  hashToken,
  VALIDADE_SESSAO,
} from "@/lib/token";

export type Sessao = {
  usuarioId: string;
  clienteId: string;
  nome: string;
  email: string;
  expiraEm: string;
};

/** Abre a sessao e devolve o token CRU, para virar cookie. */
export async function abrirSessao(usuarioId: string): Promise<string> {
  const token = gerarToken();
  await db().execute(sql`
    insert into sessoes (id, usuario_id, token_hash, expira_em)
    values (
      gen_random_uuid()::text,
      ${usuarioId},
      ${await hashToken(token)},
      ${expiraEm(VALIDADE_SESSAO).toISOString()}
    )
  `);
  return token;
}

/**
 * Sessao valida, ou null.
 *
 * `u.ativo` entra no filtro para que desativar um usuario derrube as sessoes
 * dele ja na proxima requisicao, sem precisar cacar linha por linha.
 */
export async function lerSessao(token: string): Promise<Sessao | null> {
  const linhas = await consultar<{
    usuario_id: string;
    cliente_id: string;
    nome: string;
    email: string;
    expira_em: string;
  }>(sql`
    select s.usuario_id, u.cliente_id, c.nome, u.email, s.expira_em
      from sessoes s
      join usuarios u on u.id = s.usuario_id and u.ativo
      join clientes c on c.id = u.cliente_id
     where s.token_hash = ${await hashToken(token)}
       and s.expira_em > now()
     limit 1
  `);

  if (linhas.length === 0) return null;
  const l = linhas[0];
  return {
    usuarioId: l.usuario_id,
    clienteId: l.cliente_id,
    nome: l.nome,
    email: l.email,
    expiraEm: l.expira_em,
  };
}

/**
 * Empurra o vencimento quando falta menos da metade da janela.
 *
 * Renovar a cada requisicao custaria um UPDATE por clique sem mudar nada de
 * pratico. Devolve true quando renovou — quem chama precisa saber para
 * reescrever o cookie.
 */
export async function renovarSeprecisar(token: string): Promise<boolean> {
  const r = await consultar<{ id: string }>(sql`
    update sessoes
       set expira_em = ${expiraEm(VALIDADE_SESSAO).toISOString()}
     where token_hash = ${await hashToken(token)}
       and expira_em > now()
       and expira_em - now() < make_interval(secs => ${VALIDADE_SESSAO / 2000})
     returning id
  `);
  return r.length === 1;
}

/** Fecha a sessao no banco. Apagar so o cookie deixaria o token valido para
 *  quem ja o tivesse copiado. */
export async function apagarSessao(token: string): Promise<void> {
  await db().execute(sql`
    delete from sessoes where token_hash = ${await hashToken(token)}
  `);
}

/** Usado ao trocar a senha: derruba tudo que estava aberto. */
export async function apagarSessoesDoUsuario(usuarioId: string): Promise<void> {
  await db().execute(sql`delete from sessoes where usuario_id = ${usuarioId}`);
}
