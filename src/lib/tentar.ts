/**
 * Tenta de novo o que falhou por acidente — e só isso.
 *
 * Três tentativas com espera curta entre elas (pedido do Guilherme,
 * 15/09/2026). O que carrega o peso aqui não é o laço, é a SEPARAÇÃO entre
 * falha passageira e falha definitiva: repetir três vezes um endereço de
 * e-mail inválido, uma chave errada ou a cota do dia estourada não conserta
 * nada, atrasa o resto da fila e gasta orçamento do Worker à toa.
 *
 * Quem chama sinaliza "não adianta repetir" lançando ErroDefinitivo.
 *
 * `setTimeout` conta tempo de RELÓGIO, não de CPU. O limite do plano free da
 * Cloudflare é de CPU, então a espera daqui não encosta nele.
 */

export const TENTATIVAS = 3;

/** Duas esperas, porque três tentativas têm dois intervalos. */
const ESPERA_MS = [400, 1200];

/** Falha que não melhora se repetir. Interrompe o laço na hora. */
export class ErroDefinitivo extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ErroDefinitivo";
  }
}

const dormir = (ms: number) => new Promise((pronto) => setTimeout(pronto, ms));

export async function tentar<T>(operacao: () => Promise<T>): Promise<T> {
  let ultimaFalha: unknown;

  for (let i = 0; i < TENTATIVAS; i++) {
    try {
      return await operacao();
    } catch (falha) {
      if (falha instanceof ErroDefinitivo) throw falha;
      ultimaFalha = falha;
      if (i < TENTATIVAS - 1) await dormir(ESPERA_MS[i]);
    }
  }

  throw ultimaFalha;
}
