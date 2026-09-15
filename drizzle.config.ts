import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// O Next carrega .env.local sozinho; o drizzle-kit roda fora dele.
config({ path: ".env.local" });

const url = process.env.DATABASE_URL_UNPOOLED;
if (!url) {
  throw new Error(
    "DATABASE_URL_UNPOOLED nao definida. Migracao precisa da conexao DIRETA " +
      "(sem -pooler no hostname): o pooler roda em modo transacao e nao " +
      "mantem o estado de sessao que a migracao exige.",
  );
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
  casing: "snake_case",
  verbose: true,
  strict: true,
});
