/**
 * Tokens de link de acesso — primeiro acesso e recuperacao de senha.
 *
 * O token cru existe so em memoria e no e-mail do cliente. O banco guarda o
 * SHA-256. Se este banco vazar, nenhuma linha daqui serve para forjar um link.
 */

import { sql } from "drizzle-orm";
import { consultar, db } from "./index";
import { expiraEm, gerarToken, hashToken, VALIDADE_LINK } from "@/lib/token";
import { normalizarEmail } from "@/lib/senha";

export type TipoToken = "primeiro_acesso" | "recuperar_senha";

/**
 * Procura o cliente pelo e-mail e devolve o usuario dele, se existir.
 *
 * O usuario pode nao existir ainda: no primeiro acesso ele nasce so quando a
 * senha e criada. Por isso o retorno tem clienteId sempre e usuarioId talvez.
 */
export async function acharDestino(email: string): Promise<{
  clienteId: string;
  usuarioId: string | null;
  nome: string;
  email: string;
} | null> {
  const alvo = normalizarEmail(email);
  const linhas = await consultar<{
    cliente_id: string;
    nome: string;
    email: string;
    usuario_id: string | null;
  }>(sql`
    select c.id as cliente_id, c.nome, c.email, u.id as usuario_id
      from clientes c
      left join usuarios u on u.cliente_id = c.id and u.email = ${alvo} and u.ativo
     where c.email = ${alvo}
     limit 1
  `);

  if (linhas.length === 0) return null;
  const l = linhas[0];
  return {
    clienteId: l.cliente_id,
    usuarioId: l.usuario_id,
    nome: l.nome,
    email: l.email,
  };
}

/** Intervalo minimo entre dois pedidos de link para a mesma conta. */
const ESPERA_ENTRE_PEDIDOS_SEG = 60;

/**
 * Trava de frequencia por conta.
 *
 * Sem isso, o formulario de primeiro acesso vira uma maquina de encher a
 * caixa de entrada de qualquer cliente: basta apertar enviar em sequencia.
 *
 * NAO cobre varredura por IP — para isso seria preciso KV ou Durable Object,
 * que e infraestrutura nova. Decisao pendente com o Guilherme.
 */
export async function podePedirLink(
  clienteId: string,
  tipo: TipoToken,
): Promise<boolean> {
  const r = await consultar<unknown>(sql`
    select 1
      from tokens_acesso
     where cliente_id = ${clienteId}
       and tipo = ${tipo}
       and criado_em > now() - make_interval(secs => ${ESPERA_ENTRE_PEDIDOS_SEG})
     limit 1
  `);
  return r.length === 0;
}

/**
 * Cria um link de acesso e devolve o token CRU — a unica vez que ele existe
 * legivel. Quem chama manda no e-mail e esquece.
 *
 * Invalida os links anteriores do mesmo tipo: pedir um link novo tem que
 * matar o antigo, senao um e-mail velho continua abrindo a conta.
 */
export async function criarLink(
  clienteId: string,
  usuarioId: string | null,
  tipo: TipoToken,
): Promise<string> {
  const token = gerarToken();
  const hash = await hashToken(token);

  await db().execute(sql`
    update tokens_acesso
       set usado_em = now()
     where cliente_id = ${clienteId} and tipo = ${tipo} and usado_em is null
  `);

  await db().execute(sql`
    insert into tokens_acesso (id, cliente_id, usuario_id, token_hash, tipo, expira_em)
    values (
      gen_random_uuid()::text,
      ${clienteId},
      ${usuarioId},
      ${hash},
      ${tipo},
      ${expiraEm(VALIDADE_LINK).toISOString()}
    )
  `);

  return token;
}

export type LinkConferido =
  | { valido: false; motivo: "inexistente" | "expirado" | "usado" }
  | {
      valido: true;
      tokenId: string;
      clienteId: string;
      usuarioId: string | null;
      nome: string;
      email: string;
    };

/** Confere um token sem consumir. Usado para decidir o que a tela mostra. */
export async function conferirLink(token: string): Promise<LinkConferido> {
  const hash = await hashToken(token);
  const linhas = await consultar<{
    id: string;
    cliente_id: string;
    usuario_id: string | null;
    usado_em: string | null;
    expirado: boolean;
    nome: string;
    email: string;
  }>(sql`
    select t.id, t.cliente_id, t.usuario_id, t.usado_em,
           t.expira_em < now() as expirado,
           c.nome, c.email
      from tokens_acesso t
      join clientes c on c.id = t.cliente_id
     where t.token_hash = ${hash}
     limit 1
  `);

  if (linhas.length === 0) return { valido: false, motivo: "inexistente" };
  const l = linhas[0];
  if (l.usado_em !== null) return { valido: false, motivo: "usado" };
  if (l.expirado) return { valido: false, motivo: "expirado" };

  return {
    valido: true,
    tokenId: l.id,
    clienteId: l.cliente_id,
    usuarioId: l.usuario_id,
    nome: l.nome,
    email: l.email,
  };
}

/**
 * Marca como usado. O `and usado_em is null` no where nao e redundancia:
 * duas abas abrindo o mesmo link ao mesmo tempo, so uma consome. A outra
 * recebe 0 linhas e sabe que perdeu.
 */
export async function consumirLink(tokenId: string): Promise<boolean> {
  const r = await consultar<{ id: string }>(sql`
    update tokens_acesso set usado_em = now()
     where id = ${tokenId} and usado_em is null
     returning id
  `);
  return r.length === 1;
}

/**
 * Garante que existe um usuario para este cliente/e-mail e devolve o id.
 * No primeiro acesso e aqui que ele nasce.
 */
export async function garantirUsuario(
  clienteId: string,
  email: string,
): Promise<string> {
  const alvo = normalizarEmail(email);
  const r = await consultar<{ id: string }>(sql`
    insert into usuarios (id, cliente_id, email)
    values (gen_random_uuid()::text, ${clienteId}, ${alvo})
    on conflict (email) do update set atualizado_em = now()
    returning id
  `);
  return r[0].id;
}
