/**
 * Hash de senha com PBKDF2 pela Web Crypto.
 *
 * Por que PBKDF2 e nao scrypt/argon2: o ETAPAS.md pedia scrypt, mas a Web
 * Crypto padrao nao implementa scrypt — so PBKDF2. E bcrypt/argon2 nativos
 * estao fora porque o Workers nao carrega dependencia nativa. Decisao do
 * Guilherme: fica PBKDF2 e testamos scrypt depois.
 *
 * As iteracoes ficam gravadas junto do hash. Isso permite subir o custo no
 * futuro e re-hashear no proximo login, sem invalidar senha de ninguem.
 *
 * ATENCAO ao custo: 210 mil iteracoes de SHA-512 gastam MUITO mais que os
 * 10ms de CPU do plano gratuito do Workers. O login exige o plano pago.
 */

/** OWASP para PBKDF2-HMAC-SHA512. */
const ITERACOES = 210_000;
const BYTES_SAL = 16;
const BYTES_CHAVE = 32;

export const MIN_SENHA = 8;

export type SenhaGuardada = {
  hash: string;
  salt: string;
  iteracoes: number;
};

function paraBase64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function deBase64(texto: string): Uint8Array {
  const bin = atob(texto);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function derivar(
  senha: string,
  salt: Uint8Array,
  iteracoes: number,
): Promise<Uint8Array> {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(senha.normalize("NFKC")),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: iteracoes, hash: "SHA-512" },
    material,
    BYTES_CHAVE * 8,
  );
  return new Uint8Array(bits);
}

/** Comparacao de tempo constante: nunca sai mais cedo por diferenca. */
function iguaisEmTempoConstante(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diferenca = 0;
  for (let i = 0; i < a.length; i++) diferenca |= a[i] ^ b[i];
  return diferenca === 0;
}

export async function criarHash(senha: string): Promise<SenhaGuardada> {
  const salt = crypto.getRandomValues(new Uint8Array(BYTES_SAL));
  const chave = await derivar(senha, salt, ITERACOES);
  return {
    hash: paraBase64(chave),
    salt: paraBase64(salt),
    iteracoes: ITERACOES,
  };
}

export async function conferirSenha(
  senha: string,
  guardada: Partial<SenhaGuardada> | null | undefined,
): Promise<boolean> {
  if (!guardada?.hash || !guardada.salt || !guardada.iteracoes) return false;
  const chave = await derivar(senha, deBase64(guardada.salt), guardada.iteracoes);
  return iguaisEmTempoConstante(chave, deBase64(guardada.hash));
}

/** true quando o hash foi feito com custo menor que o atual. */
export function precisaRehash(guardada: Pick<SenhaGuardada, "iteracoes">): boolean {
  return guardada.iteracoes < ITERACOES;
}

export function senhaInvalida(senha: string): string | null {
  if (senha.length < MIN_SENHA) {
    return `A senha precisa de pelo menos ${MIN_SENHA} caracteres.`;
  }
  return null;
}
