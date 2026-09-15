/**
 * So roda no servidor. Nao precisa do pacote "server-only": o next/headers
 * abaixo ja quebra o build se este arquivo for parar num componente de
 * cliente.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  abrirSessao,
  apagarSessao,
  lerSessao,
  renovarSeprecisar,
  type Sessao,
} from "@/db/sessoes";
import { VALIDADE_SESSAO } from "./token";

const NOME_COOKIE = "sessao";

/**
 * SameSite=Lax, nao Strict.
 *
 * Com Strict, chegar por um link de fora — o e-mail de cobranca, um
 * WhatsApp — nao manda o cookie na primeira navegacao, e a pessoa ve a tela
 * de login mesmo com sessao valida. Parece defeito. O Lax protege igual no
 * que importa: as rotas que mudam estado sao POST, e o Lax nao envia cookie
 * em POST vindo de outro site.
 *
 * secure: true tambem em desenvolvimento — o navegador trata localhost como
 * contexto seguro, entao funciona nos dois lugares sem condicional.
 */
const OPCOES = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
};

export async function gravarCookieSessao(token: string): Promise<void> {
  (await cookies()).set(NOME_COOKIE, token, {
    ...OPCOES,
    maxAge: VALIDADE_SESSAO / 1000,
  });
}

/** Abre a sessao e ja deixa o cookie gravado. */
export async function entrar(usuarioId: string): Promise<void> {
  await gravarCookieSessao(await abrirSessao(usuarioId));
}

/**
 * Sessao do pedido atual, ou null. Renova o prazo quando esta pela metade.
 *
 * Nao lanca e nao redireciona: serve para a tela decidir o que mostrar.
 */
export async function sessaoAtual(): Promise<Sessao | null> {
  const token = (await cookies()).get(NOME_COOKIE)?.value;
  if (!token) return null;

  const sessao = await lerSessao(token);
  if (!sessao) return null;

  if (await renovarSeprecisar(token)) {
    await gravarCookieSessao(token);
  }
  return sessao;
}

/**
 * Exige sessao. Chamada no topo de cada pagina protegida — lista EXPLICITA,
 * nao deduzida do caminho. Deduzir erraria calado no dia em que uma rota
 * fugisse do padrao, e erraria para o lado de deixar aberto.
 */
export async function exigirSessao(voltarPara?: string): Promise<Sessao> {
  const sessao = await sessaoAtual();
  if (!sessao) {
    // `voltarPara` existe por causa do botao "Pagar agora" do e-mail: ele
    // aponta para a fatura, e sem isso a pessoa cairia no login e depois na
    // home do portal, tendo que procurar a fatura de novo. Quem valida o
    // valor e o login, nao aqui.
    redirect(
      voltarPara
        ? `/portal/login?voltar=${encodeURIComponent(voltarPara)}`
        : "/portal/login",
    );
  }
  return sessao;
}

/** Encerra dos dois lados: apaga a linha e derruba o cookie. */
export async function sair(): Promise<void> {
  const caixa = await cookies();
  const token = caixa.get(NOME_COOKIE)?.value;
  if (token) await apagarSessao(token);
  caixa.delete(NOME_COOKIE);
}
