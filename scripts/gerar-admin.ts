/* Gera as credenciais do admin.
 *
 * Sem argumento, sorteia uma senha forte. Com argumento, usa a que voce
 * passar — mas aí ela fica no histórico do terminal, então prefira a
 * sorteada e guarde no seu gerenciador de senhas.
 *
 *   npm run admin:credenciais
 *   npm run admin:credenciais -- "minha senha escolhida"
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { sql } from "drizzle-orm";
import { consultar } from "@/db";
import { preHash } from "@/lib/senha";

const ALFABETO = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function sortear(tamanho: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(tamanho));
  return [...bytes].map((b) => ALFABETO[b % ALFABETO.length]).join("");
}

(async () => {
  const informada = process.argv.slice(2).join(" ").trim();
  const senha = informada || sortear(24);
  const segredo = sortear(48);

  // O bcrypt e do Postgres, igual ao dos clientes: o formato guardado aqui
  // e exatamente o mesmo da coluna senha_hash.
  const r = await consultar<{ hash: string }>(
    sql`select crypt(${await preHash(senha)}, gen_salt('bf', 12)) as hash`,
  );

  console.log("\n=== COLE NO .env.local ===\n");
  console.log(`ADMIN_EMAIL="seu@email.com"`);
  console.log(`ADMIN_SENHA_HASH="${r[0].hash}"`);
  console.log(`ADMIN_SESSAO_SEGREDO="${segredo}"`);
  console.log("\n=== A SENHA (aparece uma vez) ===\n");
  console.log(`   ${senha}\n`);
  console.log("Guarde no gerenciador de senhas. Ela nao fica em lugar nenhum:");
  console.log("o .env.local guarda so o hash, que nao volta para a senha.");
  console.log("Troque o ADMIN_EMAIL pelo seu e-mail de verdade.\n");
  process.exit(0);
})().catch((e) => {
  console.log("ERRO:", e.message);
  process.exit(1);
});
