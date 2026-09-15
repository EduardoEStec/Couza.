/**
 * Tokens de link de acesso e de sessao.
 *
 * O token cru vai para o e-mail (ou para o cookie) e some daqui. No banco
 * fica so o SHA-256 dele. Se o banco vazar, ninguem entra com o que leu.
 *
 * SHA-256 simples basta — ao contrario de senha, o token tem 256 bits de
 * aleatoriedade, entao nao ha o que um ataque de forca bruta adivinhe. O
 * custo alto do PBKDF2 existe para compensar senha fraca de gente.
 */

const BYTES_TOKEN = 32;

/** Valores em milissegundos. */
export const VALIDADE_LINK = 60 * 60 * 1000; // 1 hora, como o ETAPAS.md pede
export const VALIDADE_SESSAO = 30 * 24 * 60 * 60 * 1000; // 30 dias

export function gerarToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(BYTES_TOKEN));
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  // base64url: entra numa URL sem escapar nada.
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function hashToken(token: string): Promise<string> {
  const bits = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return [...new Uint8Array(bits)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function expiraEm(duracaoMs: number): Date {
  return new Date(Date.now() + duracaoMs);
}
