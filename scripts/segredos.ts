/* Confere se o .env.local tem tudo que a producao precisa, e imprime os
 * comandos para subir cada segredo para o Cloudflare Workers.
 *   npm run cf:segredos
 *
 * NUNCA imprime valor de segredo — so o NOME e se esta presente. O valor
 * voce digita no prompt do wrangler, que nao o grava em lugar nenhum.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

type Segredo = {
  nome: string;
  precisa: boolean;
  nota?: string;
  /** Confere se o valor faz sentido, sem revelar qual e. */
  confere?: (v: string) => string | null;
};

const SEGREDOS: Segredo[] = [
  {
    nome: "DATABASE_URL",
    precisa: true,
    nota: "banco de PRODUCAO, com -pooler no hostname",
    confere: (v) =>
      v.includes("-pooler")
        ? null
        : "nao tem '-pooler': em producao o app usa a conexao pooled",
  },
  {
    nome: "RESEND_API_KEY",
    precisa: true,
    confere: (v) => (v.startsWith("re_") ? null : "nao comeca com 're_'"),
  },
  {
    nome: "EMAIL_REMETENTE",
    precisa: true,
    nota: "endereco no subdominio verificado na Resend",
  },
  {
    nome: "ASAAS_API_KEY_PRODUCAO",
    precisa: true,
    nota: "SO no ultimo passo do deploy",
    confere: (v) =>
      v.startsWith("$aact_prod_")
        ? null
        : "nao comeca com '$aact_prod_' — o codigo recusa antes de chamar a API",
  },
  {
    nome: "ASAAS_WEBHOOK_TOKEN",
    precisa: true,
    nota: "o MESMO valor no campo authToken do painel do Asaas",
    confere: (v) =>
      v.length >= 32 && v.length <= 255
        ? null
        : `tem ${v.length} caracteres; o Asaas exige entre 32 e 255`,
  },
  {
    nome: "CRON_SEGREDO",
    precisa: true,
    nota: "o custom-worker manda no header x-cron-segredo",
    confere: (v) => (v.length >= 32 ? null : `so ${v.length} caracteres; use 32+`),
  },
  { nome: "ADMIN_EMAIL", precisa: true },
  {
    nome: "ADMIN_SENHA_HASH",
    precisa: true,
    confere: (v) => (v.startsWith("$2") ? null : "nao parece um hash bcrypt"),
  },
  {
    nome: "ADMIN_SESSAO_SEGREDO",
    precisa: true,
    confere: (v) => (v.length >= 32 ? null : `so ${v.length} caracteres; use 32+`),
  },
];

/** Vao como `vars` no wrangler.jsonc, nao como secret: nao sao sigilosos. */
const PUBLICAS = [
  ["ASAAS_AMBIENTE", "producao"],
  ["URL_BASE", "https://courte.com.br"],
  ["SMS_ATIVO", "false"],
];

let problemas = 0;
console.log("SEGREDOS DO WORKER (valor nenhum aparece aqui)\n");

for (const s of SEGREDOS) {
  const v = process.env[s.nome] ?? "";
  const nota = s.nota ? `  — ${s.nota}` : "";

  if (v === "") {
    problemas++;
    console.log(`  FALTA    ${s.nome}${nota}`);
    continue;
  }

  const erro = s.confere?.(v) ?? null;
  if (erro) {
    problemas++;
    console.log(`  SUSPEITO ${s.nome}: ${erro}`);
  } else {
    console.log(`  ok       ${s.nome} (${v.length} caracteres)${nota}`);
  }
}

console.log("\nComandos para subir, um a um (ele pergunta o valor):\n");
for (const s of SEGREDOS) console.log(`  npx wrangler secret put ${s.nome}`);

console.log("\nEstas NAO sao segredo — deixe como vars no wrangler.jsonc:\n");
for (const [k, v] of PUBLICAS) console.log(`  ${k} = "${v}"`);

if (problemas > 0) {
  console.log(
    `\n${problemas} item(ns) para resolver ANTES do deploy. Lembre que o ` +
      `.env.local ainda esta apontando para o ambiente de desenvolvimento.`,
  );
}
