/* Pré-renderiza os e-mails para src/emails/gerados.ts.
 *   npm run emails:gerar
 *
 * POR QUE ISTO EXISTE
 * Renderizar um template React custou ~8 ms de CPU por e-mail, medido em
 * 15/09/2026. O plano free do Cloudflare Workers dá 10 ms por invocação —
 * uma remessa de 50 cobranças gastava 406 ms, 40x o orçamento.
 *
 * Mas o conteúdo de um e-mail de cobrança só muda em seis lugares: nome,
 * número, descrição, valor, vencimento e link. O resto é sempre igual.
 * Então o React roda UMA vez, aqui, na sua máquina — e o Worker só troca
 * texto, que custa microssegundos.
 *
 * O template continua sendo a fonte da verdade. Este arquivo é derivado, e
 * o teste `npm run teste:emails` refaz o render e compara: se alguém mexer
 * no template e esquecer de rodar isto, o teste acusa.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { writeFileSync } from "node:fs";
import { render } from "@react-email/components";
import { Cobranca, type MomentoCobranca } from "@/emails/cobranca";
import { PagamentoConfirmado } from "@/emails/pagamento-confirmado";
import { LinkAcesso, type TipoLink } from "@/emails/link-acesso";

/**
 * Marcadores. Sem caractere que o HTML escape (`<`, `&`, aspas), senão
 * o React os transformaria e a troca depois não acharia nada.
 */
const M = {
  nome: "%%nome%%",
  numero: "%%numero%%",
  descricao: "%%descricao%%",
  valor: "%%valor%%",
  vencimento: "%%vencimento%%",
  url: "%%url%%",
  forma: "%%forma%%",
  validade: "%%validade%%",
} as const;

const MOMENTOS: MomentoCobranca[] = [
  "cobranca_nova",
  "cobranca_lembrete",
  "cobranca_vencida",
];

/** Cada marcador tem que sobreviver ao render, e aparecer o tanto certo. */
function conferir(nome: string, html: string, esperados: string[]) {
  for (const m of esperados) {
    if (!html.includes(m)) {
      throw new Error(
        `${nome}: o marcador ${m} sumiu no render. O React deve ter quebrado ` +
          `o texto em pedaços — troque o marcador ou o lugar onde ele entra.`,
      );
    }
  }
}

(async () => {
  const partes: string[] = [];

  for (const momento of MOMENTOS) {
    const html = await render(
      Cobranca({
        nome: M.nome,
        numero: M.numero,
        descricao: M.descricao,
        valor: M.valor,
        vencimento: M.vencimento,
        url: M.url,
        momento,
      }),
    );
    conferir(momento, html, [
      M.nome, M.numero, M.descricao, M.valor, M.vencimento, M.url,
    ]);
    partes.push(`  ${momento}: ${JSON.stringify(html)},`);
  }

  /**
   * Duas versões da confirmação, e não uma com condicional: quando o Asaas
   * não diz a forma de pagamento, a frase simplesmente não a menciona.
   * Resolver isso com troca de texto exigiria apagar um trecho no meio da
   * frase — mais frágil do que ter as duas prontas.
   */
  for (const [chave, forma] of [
    ["pagamento_confirmado", M.forma],
    ["pagamento_confirmado_sem_forma", ""],
  ] as const) {
    const html = await render(
      PagamentoConfirmado({
        nome: M.nome,
        numero: M.numero,
        descricao: M.descricao,
        valor: M.valor,
        forma,
        url: M.url,
      }),
    );
    conferir(chave, html, [M.nome, M.numero, M.descricao, M.valor, M.url]);
    if (forma) conferir(chave, html, [M.forma]);
    partes.push(`  ${chave}: ${JSON.stringify(html)},`);
  }

  // Link de acesso: primeiro acesso e recuperacao de senha.
  for (const tipo of ["primeiro_acesso", "recuperar_senha"] as TipoLink[]) {
    const html = await render(
      LinkAcesso({ nome: M.nome, url: M.url, validadeTexto: M.validade, tipo }),
    );
    conferir(tipo, html, [M.nome, M.url, M.validade]);
    partes.push(`  ${tipo}: ${JSON.stringify(html)},`);
  }

  const arquivo = `/**
 * GERADO POR scripts/gerar-emails.ts — NÃO EDITE À MÃO.
 *
 * Mexeu num template em src/emails/? Rode \`npm run emails:gerar\`.
 * O teste \`npm run teste:emails\` confere se este arquivo está em dia.
 *
 * Existe para tirar o React do caminho do envio: renderizar custava ~8 ms
 * de CPU por e-mail, e o plano free do Workers dá 10 ms por invocação.
 * Aqui o Worker só troca texto.
 */

export const EMAILS = {
${partes.join("\n")}
} as const;

export type ChaveEmail = keyof typeof EMAILS;
`;

  writeFileSync("src/emails/gerados.ts", arquivo, "utf8");

  const kb = (arquivo.length / 1024).toFixed(1);
  console.log(`src/emails/gerados.ts escrito — ${partes.length} peças, ${kb} KB`);
})().catch((e) => {
  console.error("FALHOU:", e instanceof Error ? e.message : e);
  process.exit(1);
});
