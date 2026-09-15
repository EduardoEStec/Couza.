/**
 * O unico lugar do sistema que fala HTTP com o Asaas.
 *
 * Nada fora de src/lib/asaas/ chama a API deles direto — e o que o
 * ETAPAS.md pede ("camada de integracao isolada em um modulo so, com
 * tipos"), e o que permite trocar de gateway sem caçar fetch pelo codigo.
 *
 * API v3. Base de sandbox e de producao conforme a documentacao oficial
 * consultada em 15/09/2026; autenticacao pelo header `access_token`.
 */

const BASES = {
  sandbox: "https://api-sandbox.asaas.com/v3",
  producao: "https://api.asaas.com/v3",
} as const;

/**
 * Prefixo que a chave PRECISA ter em cada ambiente.
 *
 * Esta trava existe por causa de um erro real: o .env.local dizia
 * ambiente "sandbox" e carregava uma chave "$aact_prod_". Sem conferir, o
 * sistema teria tentado falar com a conta de PRODUCAO achando que era
 * teste. Agora isso nao compila nem roda: estoura na primeira chamada,
 * com mensagem clara, antes de sair qualquer requisicao.
 */
const PREFIXO = {
  sandbox: "$aact_hmlg_",
  producao: "$aact_prod_",
} as const;

export type Ambiente = keyof typeof BASES;

export type ErroAsaas = {
  code: string;
  description: string;
};

/** Erro da API do Asaas, ja traduzido. Nunca vira tela branca. */
export class FalhaAsaas extends Error {
  constructor(
    readonly status: number,
    readonly erros: ErroAsaas[],
    readonly rota: string,
  ) {
    super(
      erros.length > 0
        ? erros.map((e) => e.description).join("; ")
        : `Asaas respondeu ${status} em ${rota}`,
    );
    this.name = "FalhaAsaas";
  }
}

function configuracao(): { base: string; chave: string; ambiente: Ambiente } {
  const ambiente = (process.env.ASAAS_AMBIENTE ?? "sandbox") as Ambiente;
  if (!(ambiente in BASES)) {
    throw new Error(
      `ASAAS_AMBIENTE inválido: "${ambiente}". Use "sandbox" ou "producao".`,
    );
  }

  const chave =
    ambiente === "producao"
      ? process.env.ASAAS_API_KEY_PRODUCAO
      : process.env.ASAAS_API_KEY_SANDBOX;

  if (!chave) {
    throw new Error(
      `Chave do Asaas ausente para o ambiente "${ambiente}". ` +
        `Defina ASAAS_API_KEY_${ambiente === "producao" ? "PRODUCAO" : "SANDBOX"}.`,
    );
  }

  if (!chave.startsWith(PREFIXO[ambiente])) {
    throw new Error(
      `A chave do Asaas não pertence ao ambiente "${ambiente}": ela começa ` +
        `com "${chave.slice(0, 11)}" e deveria começar com "${PREFIXO[ambiente]}". ` +
        `Nenhuma requisição foi enviada.`,
    );
  }

  return { base: BASES[ambiente], chave, ambiente };
}

/** Qual ambiente está ativo. Útil para a tela avisar que é sandbox. */
export function ambienteAtivo(): Ambiente {
  return configuracao().ambiente;
}

export async function chamar<T>(
  metodo: "GET" | "POST" | "PUT" | "DELETE",
  rota: string,
  corpo?: unknown,
): Promise<T> {
  const { base, chave } = configuracao();

  const r = await fetch(`${base}${rota}`, {
    method: metodo,
    headers: {
      access_token: chave,
      "Content-Type": "application/json",
    },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });

  const texto = await r.text();
  let json: unknown = null;
  try {
    json = texto === "" ? null : JSON.parse(texto);
  } catch {
    // resposta que nao e JSON: cai no erro abaixo com o status
  }

  if (!r.ok) {
    const erros =
      (json as { errors?: ErroAsaas[] } | null)?.errors ?? ([] as ErroAsaas[]);
    throw new FalhaAsaas(r.status, erros, `${metodo} ${rota}`);
  }

  return json as T;
}
