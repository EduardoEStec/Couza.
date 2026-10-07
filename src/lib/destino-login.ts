/**
 * Para onde mandar a pessoa depois que ela entra.
 *
 * O e-mail de cobrança aponta para a fatura; quem não está logado cai no
 * login e precisa voltar para LÁ, não para a home do portal.
 *
 * A lista de permissão é fechada de propósito. Aceitar um destino qualquer
 * vindo da URL é redirecionamento aberto: bastaria mandar
 * `/portal/login?voltar=https://site-falso` para usar couza.com.br como
 * trampolim num golpe — o link sai do meu domínio, com a minha cara, e
 * termina em outro lugar.
 *
 * São aceitos só caminhos internos começando em `/portal/`, sem barra dupla
 * (que o navegador lê como outro domínio: `//evil.com`) e sem barra
 * invertida (que alguns navegadores tratam como barra).
 *
 * Mora fora do arquivo de ações porque num módulo `"use server"` todo export
 * vira server action — e uma trava de segurança que não dá para testar não
 * serve de trava.
 */

export const DESTINO_PADRAO = "/portal";

export function destinoDoLogin(bruto: string): string {
  if (!bruto || bruto.length > 200) return DESTINO_PADRAO;
  if (!bruto.startsWith("/portal/")) return DESTINO_PADRAO;
  if (bruto.includes("//") || bruto.includes("\\")) return DESTINO_PADRAO;
  return /^\/portal\/[\w\-/]*$/.test(bruto) ? bruto : DESTINO_PADRAO;
}
