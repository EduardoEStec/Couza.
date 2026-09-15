/* Testa a etapa 8: retry, trava de envio duplicado e as tres listas do cron.
 *   npm run teste:emails
 *
 * O envio de verdade so acontece se voce passar --enviar EMAIL, porque o
 * plano free da Resend da 100 e-mails por dia e teste nao pode comer isso.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { sql } from "drizzle-orm";
import { consultar } from "@/db";
import { enviarUmaVez, liberarTravadas } from "@/lib/email";
import { ErroDefinitivo, tentar, TENTATIVAS } from "@/lib/tentar";
import { rodarCobrancas } from "@/lib/cobranca-email";
import { destinoDoLogin } from "@/lib/destino-login";
import { render } from "@react-email/components";
import { Cobranca } from "@/emails/cobranca";
import { PagamentoConfirmado } from "@/emails/pagamento-confirmado";

let falhas = 0;
const ok = (c: boolean, m: string) => {
  if (!c) falhas++;
  console.log((c ? "  ok     " : "  FALHOU ") + m);
};

const daquiA = (dias: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
};

(async () => {
  console.log("1) retry: tres tentativas, e para no que nao adianta repetir");
  {
    let n = 0;
    const r = await tentar(async () => {
      n++;
      if (n < 3) throw new Error("cai na primeira e na segunda");
      return "passou";
    });
    ok(r === "passou" && n === 3, `insistiu ate dar certo (${n} tentativas)`);
  }
  {
    let n = 0;
    const inicio = Date.now();
    await tentar(async () => {
      n++;
      throw new Error("sempre falha");
    }).catch(() => {});
    const levou = Date.now() - inicio;
    ok(n === TENTATIVAS, `desistiu depois de ${n} tentativas`);
    ok(levou >= 1500 && levou < 4000, `esperou entre as tentativas (${levou}ms)`);
  }
  {
    let n = 0;
    await tentar(async () => {
      n++;
      throw new ErroDefinitivo("endereco invalido");
    }).catch(() => {});
    ok(n === 1, "erro definitivo nao e repetido — tentou 1 vez so");
  }

  console.log("\n2) os templates renderizam");
  {
    const html = await render(
      Cobranca({
        nome: "Fulana", numero: 42, descricao: "Mensalidade do site",
        valorCentavos: 25000, vencimento: daquiA(3),
        url: "https://courte.com.br/portal/pagamento/abc", momento: "cobranca_vencida",
      }),
    );
    ok(html.includes("250,00"), "valor formatado em reais no HTML");
    ok(html.includes("Cobrança vencida"), "copy do momento certo");
    ok(!html.includes("undefined"), "sem 'undefined' vazando para o e-mail");
    ok(html.length < 102_400, `abaixo dos 102KB que o Gmail corta (${(html.length / 1024).toFixed(1)}KB)`);
    const confirmacao = await render(
      PagamentoConfirmado({
        nome: "Fulana", numero: 42, descricao: "Mensalidade do site",
        valorCentavos: 25000, forma: "pix",
        url: "https://courte.com.br/portal/faturas/abc/recibo",
      }),
    );
    ok(confirmacao.includes("por Pix"), "confirmacao diz a forma de pagamento");
    ok(confirmacao.length < 102_400, `confirmacao abaixo de 102KB (${(confirmacao.length / 1024).toFixed(1)}KB)`);
  }

  console.log("\n3) a trava de envio duplicado — o indice, nao um if");
  const cliente = (await consultar<{ id: string }>(sql`
    insert into clientes (id, nome, email, documento)
    values (gen_random_uuid()::text, 'Teste Emails', 'teste-emails@exemplo.invalido', '24971563792')
    returning id
  `))[0].id;
  const fatura = (await consultar<{ id: string }>(sql`
    insert into faturas (id, cliente_id, tipo, descricao, valor_centavos, vencimento, status)
    values (gen_random_uuid()::text, ${cliente}, 'avulsa', 'Teste', 1000, ${daquiA(3)}, 'aberta')
    returning id
  `))[0].id;

  const carta = {
    para: "teste-emails@exemplo.invalido",
    assunto: "Teste",
    html: "<p>teste</p>",
    tipo: "cobranca_nova" as const,
    clienteId: cliente,
    faturaId: fatura,
  };

  // Sem RESEND_API_KEY o envio falha, o que e otimo aqui: prova que a
  // falha LIBERA a vaga em vez de travar a fatura para sempre.
  const chaveReal = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;

  const primeira = await enviarUmaVez(carta);
  ok(primeira.ok === false, "sem chave da Resend, o envio falha (esperado)");
  const marcadas = await consultar<{ status: string }>(sql`
    select status from emails_enviados where fatura_id = ${fatura}
  `);
  ok(marcadas.length === 1 && marcadas[0].status === "falhou",
     "a linha ficou como 'falhou', liberando a vaga para amanha");

  const segunda = await enviarUmaVez(carta);
  ok(segunda.ok === false, "tentou DE NOVO porque a anterior falhou");

  // Agora simula um envio bem-sucedido para ver a vaga ser ocupada.
  await consultar(sql`
    update emails_enviados set status = 'enviado', erro = null
     where fatura_id = ${fatura} and id = (
       select id from emails_enviados where fatura_id = ${fatura} limit 1
     )
  `);
  const terceira = await enviarUmaVez(carta);
  ok(terceira.ok === "pulou", "com um envio bem-sucedido na mesa, PULOU sem tentar");

  const outroTipo = await enviarUmaVez({ ...carta, tipo: "cobranca_lembrete" });
  ok(outroTipo.ok !== "pulou", "outro TIPO na mesma fatura nao e bloqueado");

  if (chaveReal) process.env.RESEND_API_KEY = chaveReal;

  console.log("");
  console.log("3b) processo que morre no meio nao perde o e-mail para sempre");
  await consultar(sql`delete from emails_enviados where fatura_id = ${fatura}`);

  // Simula exatamente o caso: a vaga foi reservada e ninguem nunca voltou
  // para anotar o resultado. 20 minutos atras, acima do corte de 15.
  await consultar(sql`
    insert into emails_enviados
      (id, cliente_id, fatura_id, tipo, destinatario, assunto, status, criado_em)
    values (gen_random_uuid()::text, ${cliente}, ${fatura}, 'cobranca_nova',
            'teste-emails@exemplo.invalido', 'Teste', 'enviando',
            now() - interval '20 minutes')
  `);

  const travada = await enviarUmaVez(carta);
  ok(travada.ok === "pulou", "enquanto presa, a vaga continua ocupada (nao duplica)");

  const soltas = await liberarTravadas();
  ok(soltas === 1, `a varredura soltou ${soltas} vaga presa`);

  const depois = await consultar<{ status: string; erro: string | null }>(sql`
    select status, erro from emails_enviados where fatura_id = ${fatura}
  `);
  ok(depois[0].status === "falhou", "virou 'falhou', liberando a vaga");
  ok((depois[0].erro ?? "").includes("interrompido"),
     "o motivo fica escrito: da para diferenciar de recusa da Resend");

  const retomado = await enviarUmaVez(carta);
  ok(retomado.ok !== "pulou", "agora sim tenta de novo — o e-mail nao se perdeu");

  // Uma reserva RECENTE nao pode ser solta: ela pode ser um envio em curso.
  await consultar(sql`delete from emails_enviados where fatura_id = ${fatura}`);
  await consultar(sql`
    insert into emails_enviados
      (id, cliente_id, fatura_id, tipo, destinatario, assunto, status)
    values (gen_random_uuid()::text, ${cliente}, ${fatura}, 'cobranca_nova',
            'teste-emails@exemplo.invalido', 'Teste', 'enviando')
  `);
  ok((await liberarTravadas()) === 0, "reserva recente NAO e solta — pode estar em curso");

  console.log("\n4) as listas do cron, em modo simulacao (nao manda nada)");
  const resumo = await rodarCobrancas(true);
  ok(resumo.enviados === 0, "simulacao nao enviou nada");
  console.log(`  ${resumo.pulados} e-mail(s) sairiam numa execucao de verdade:`);
  for (const d of resumo.detalhes.slice(0, 10)) console.log("    " + d);

  console.log("");
  console.log("4b) o botao do e-mail volta para a fatura, e so para ela");
  ok(destinoDoLogin("/portal/pagamento/abc-123") === "/portal/pagamento/abc-123",
     "caminho interno de fatura passa");
  for (const golpe of [
    "https://site-falso.com",
    "//site-falso.com",
    "/portal/../admin",
    "\\site-falso.com",
    "/admin",
    "javascript:alert(1)",
  ]) {
    ok(destinoDoLogin(golpe) === "/portal", `recusado, vai para a home: ${golpe}`);
  }

  console.log("\n5) limpeza");
  await consultar(sql`delete from emails_enviados where fatura_id = ${fatura}`);
  await consultar(sql`delete from faturas where id = ${fatura}`);
  await consultar(sql`delete from clientes where id = ${cliente}`);
  console.log("  linhas de teste removidas");

  console.log(falhas === 0 ? "\nTUDO PASSOU" : `\n${falhas} FALHA(S)`);
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => {
  console.log("ERRO:", e instanceof Error ? e.message : e);
  process.exit(1);
});
