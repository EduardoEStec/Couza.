import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Conexao com o Neon pelo driver HTTP — nao TCP, porque Cloudflare
 * Workers nao abre socket para o Postgres.
 *
 * Usa a DATABASE_URL *pooled* (com -pooler no hostname): cada consulta e
 * uma requisicao HTTP, entao o modo transacao do pooler e exatamente o
 * que queremos. A direta (DATABASE_URL_UNPOOLED) e so das migracoes.
 *
 * A criacao e preguicosa de proposito: se fosse no topo do modulo, um
 * `next build` sem variavel de ambiente quebraria.
 */

type Db = ReturnType<typeof criar>;

function criar() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL nao definida. Em desenvolvimento ela vai no .env.local; " +
        "em producao, como secret do Worker (npx wrangler secret put DATABASE_URL).",
    );
  }
  return drizzle(neon(url), { schema });
}

let instancia: Db | undefined;

export function db(): Db {
  instancia ??= criar();
  return instancia;
}

export * as schema from "./schema";

/**
 * Roda SQL cru e devolve SEMPRE um array de linhas.
 *
 * Existe porque o `execute()` do drizzle devolve formatos diferentes conforme
 * o driver: o neon-http entrega `{ rows: [...] }`, outros entregam o array
 * direto. Tratar o objeto como array passa despercebido — `obj.length` e
 * undefined, `undefined === 0` e falso, e o codigo segue achando que achou
 * linha quando nao achou. Foi exatamente esse o bug. Normalizar aqui, uma
 * vez, e mais seguro do que lembrar disso em cada consulta.
 */
export async function consultar<T>(
  comando: Parameters<ReturnType<typeof db>["execute"]>[0],
): Promise<T[]> {
  const r = (await db().execute(comando)) as unknown;
  if (Array.isArray(r)) return r as T[];
  const linhas = (r as { rows?: unknown }).rows;
  return Array.isArray(linhas) ? (linhas as T[]) : [];
}
