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
