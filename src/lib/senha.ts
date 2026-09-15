/**
 * Senha — a parte que roda no Worker.
 *
 * O hash caro (bcrypt custo 12) NAO esta aqui: ele roda no Postgres, via
 * pgcrypto. Ver src/db/usuarios.ts. Dois motivos, nesta ordem:
 *
 * 1. A Cloudflare limita o PBKDF2 da Web Crypto a 100 mil iteracoes —
 *    abaixo das 210 mil que a OWASP recomenda para SHA-512. Hashear no
 *    Worker seria aceitar de saida um hash mais fraco do que o recomendado,
 *    sem poder corrigir depois.
 * 2. O plano gratuito do Workers da 10ms de CPU por requisicao. Qualquer
 *    hash aceitavel estoura isso justamente no login.
 *
 * O que roda aqui e o PRE-HASH: um SHA-256 barato (microssegundos) aplicado
 * antes de mandar para o banco. Nao substitui o bcrypt — ele e que segura o
 * ataque de forca bruta. O pre-hash existe para outra coisa:
 *
 * - O banco nunca ve a senha real. Nem o Neon, nem quem roubar a
 *   DATABASE_URL, nem um log de statements mal configurado. Isso protege o
 *   cliente que repete a mesma senha no e-mail dele.
 * - Some a limitacao de 72 bytes do bcrypt, que trunca em silencio.
 */

export const MIN_SENHA = 8;

/**
 * SHA-256 da senha, em base64 (44 caracteres — bem dentro dos 72 bytes que
 * o bcrypt aceita). NFKC antes de tudo: acento digitado de dois jeitos
 * diferentes tem que virar a mesma senha.
 *
 * Este valor e o que viaja ate o Postgres. A senha crua morre aqui.
 */
export async function preHash(senha: string): Promise<string> {
  const bits = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(senha.normalize("NFKC")),
  );
  let s = "";
  for (const b of new Uint8Array(bits)) s += String.fromCharCode(b);
  return btoa(s);
}

export function senhaInvalida(senha: string): string | null {
  if (senha.length < MIN_SENHA) {
    return `A senha precisa de pelo menos ${MIN_SENHA} caracteres.`;
  }
  return null;
}

/** E-mail sempre em minusculo, dos dois lados: gravacao e consulta. */
export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}
