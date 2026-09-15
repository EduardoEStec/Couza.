/**
 * Acesso do admin — só o Guilherme.
 *
 * Separado do login de cliente em tudo:
 * - cookie com outro nome e `path=/admin`, entao ele nem e enviado nas
 *   rotas do cliente
 * - sem tabela: nao existe linha de admin no banco, e criar uma abriria a
 *   porta para alguem virar admin por engano num update errado
 * - o cookie e ASSINADO por HMAC, porque sem linha no banco nao ha o que
 *   consultar para saber se vale
 *
 * A senha mora como hash bcrypt em variavel de ambiente, e a conferencia
 * usa o mesmo crypt() do Postgres que confere a senha dos clientes — o
 * Worker continua sem hashear nada.
 *
 * Revogar acesso = trocar ADMIN_SESSAO_SEGREDO. Toda sessao morre na hora.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { consultar } from "@/db";
import { preHash, normalizarEmail } from "./senha";

const NOME_COOKIE = "admin";
const CAMINHO = "/admin";
const DURACAO_MS = 8 * 60 * 60 * 1000;

function segredo(): string {
  const s = process.env.ADMIN_SESSAO_SEGREDO;
  if (!s || s.length < 32) {
    throw new Error(
      "ADMIN_SESSAO_SEGREDO ausente ou curta demais (mínimo 32 caracteres). " +
        "Gere com: npm run admin:credenciais",
    );
  }
  return s;
}

function paraBase64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function assinar(mensagem: string): Promise<string> {
  const chave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(segredo()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    chave,
    new TextEncoder().encode(mensagem),
  );
  return paraBase64url(new Uint8Array(mac));
}

/** Comparacao de tempo constante. */
function iguais(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

/**
 * Confere e-mail e senha do admin.
 *
 * A senha passa pelo mesmo pre-hash dos clientes antes de ir ao banco, e o
 * bcrypt e conferido pelo Postgres. Assim o formato guardado em
 * ADMIN_SENHA_HASH e exatamente o mesmo da coluna senha_hash.
 */
export async function conferirAdmin(
  email: string,
  senha: string,
): Promise<boolean> {
  const emailCerto = process.env.ADMIN_EMAIL;
  const hash = process.env.ADMIN_SENHA_HASH;
  if (!emailCerto || !hash) return false;

  const ph = await preHash(senha);
  // O crypt roda sempre, mesmo com o e-mail errado: sem isso o tempo de
  // resposta diria qual e o e-mail do admin.
  const r = await consultar<{ ok: boolean }>(
    sql`select ${hash} = crypt(${ph}, ${hash}) as ok`,
  );
  const senhaConfere = r[0]?.ok === true;

  return iguais(normalizarEmail(email), normalizarEmail(emailCerto)) && senhaConfere;
}

export async function abrirSessaoAdmin(): Promise<void> {
  const expira = String(Date.now() + DURACAO_MS);
  const valor = `${expira}.${await assinar(expira)}`;
  (await cookies()).set(NOME_COOKIE, valor, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: CAMINHO,
    maxAge: DURACAO_MS / 1000,
  });
}

export async function sessaoAdminAtiva(): Promise<boolean> {
  const valor = (await cookies()).get(NOME_COOKIE)?.value;
  if (!valor) return false;

  const [expira, mac] = valor.split(".");
  if (!expira || !mac) return false;
  if (!iguais(mac, await assinar(expira))) return false;

  const quando = Number(expira);
  return Number.isFinite(quando) && quando > Date.now();
}

export async function exigirAdmin(): Promise<void> {
  if (!(await sessaoAdminAtiva())) redirect("/admin/login");
}

export async function sairAdmin(): Promise<void> {
  (await cookies()).delete({ name: NOME_COOKIE, path: CAMINHO });
}
