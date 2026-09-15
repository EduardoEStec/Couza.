/**
 * Dinheiro sempre em centavos, inteiro — regra do CLAUDE.md. Estas funcoes
 * sao a unica fronteira entre o que a pessoa digita e o que o banco guarda.
 *
 * Nunca use Number() direto num valor em reais: 19.99 * 100 da 1998.9999...
 * em ponto flutuante, e Math.round salva por sorte, nao por desenho. Aqui o
 * texto e lido como digitos, sem passar por float nenhum.
 */

/** "1.234,56" | "1234,56" | "1234.56" | "1234" -> 123456 centavos. */
export function paraCentavos(texto: string): number | null {
  const limpo = texto.trim().replace(/[R$\s]/g, "");
  if (limpo === "") return null;

  // Descobre qual e o separador decimal: o ULTIMO ponto ou virgula, se o que
  // vem depois tiver 1 ou 2 digitos. Senao, o numero e inteiro.
  const m = limpo.match(/^(-?[\d.,]*?)([.,](\d{1,2}))?$/);
  if (!m) return null;

  const inteiro = (m[1] ?? "").replace(/[.,]/g, "");
  const decimal = (m[3] ?? "").padEnd(2, "0");
  if (!/^-?\d+$/.test(inteiro || "0")) return null;

  const negativo = inteiro.startsWith("-");
  const digitos = (inteiro.replace("-", "") || "0") + decimal;
  if (!/^\d+$/.test(digitos)) return null;

  const centavos = Number(digitos);
  return Number.isSafeInteger(centavos) ? (negativo ? -centavos : centavos) : null;
}

/** 123456 -> "1.234,56" */
export function emReais(centavos: number): string {
  const negativo = centavos < 0;
  const s = String(Math.abs(centavos)).padStart(3, "0");
  const inteiro = s.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${negativo ? "-" : ""}${inteiro},${s.slice(-2)}`;
}

/** "2026-09-15" -> "15/09/2026". Entra e sai como data de calendario. */
export function emDataBr(iso: string | null): string {
  if (!iso) return "—";
  const [a, m, d] = iso.slice(0, 10).split("-");
  return d && m && a ? `${d}/${m}/${a}` : "—";
}
