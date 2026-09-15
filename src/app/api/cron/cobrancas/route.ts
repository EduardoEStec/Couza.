/**
 * A porta do cron. A rotina em si mora em src/lib/cobranca-email.ts.
 *
 * O Cron Trigger da Cloudflare chama o handler `scheduled` do Worker, que
 * não é uma rota HTTP. Na etapa 9 o custom worker do OpenNext vai fazer um
 * fetch nesta rota a partir do `scheduled`. Ela existe separada por dois
 * motivos: dá para testar hoje, sem deploy, e dá para eu disparar na mão se
 * uma execução falhar.
 *
 * Por ser uma rota pública, ela é protegida pelo mesmo segredo que o
 * Worker vai mandar. Sem isso, qualquer um na internet dispararia a
 * remessa de e-mails — e as três tentativas de cada envio junto.
 */

import { rodarCobrancas } from "@/lib/cobranca-email";

function autorizado(req: Request): boolean {
  const esperado = process.env.CRON_SEGREDO;
  if (!esperado) return false;

  const recebido = req.headers.get("x-cron-segredo");
  if (!recebido || recebido.length !== esperado.length) return false;

  // Comparação de tempo constante, como no webhook do Asaas.
  let d = 0;
  for (let i = 0; i < esperado.length; i++) {
    d |= esperado.charCodeAt(i) ^ recebido.charCodeAt(i);
  }
  return d === 0;
}

export async function POST(req: Request): Promise<Response> {
  if (!autorizado(req)) {
    return new Response("nao autorizado", { status: 401 });
  }

  // ?simular=1 lista o que sairia, sem mandar nada. Serve para olhar antes
  // da primeira execução de verdade.
  const simular = new URL(req.url).searchParams.get("simular") === "1";

  try {
    const resumo = await rodarCobrancas(simular);
    return Response.json({ ok: true, simulado: simular, ...resumo });
  } catch (e) {
    return Response.json(
      { ok: false, erro: e instanceof Error ? e.message : "falha desconhecida" },
      { status: 500 },
    );
  }
}
