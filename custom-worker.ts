/**
 * Worker de entrada.
 *
 * O OpenNext gera `.open-next/worker.js`, que sabe responder HTTP e nada
 * mais. O Cron Trigger da Cloudflare NÃO chega como requisição HTTP: ele
 * chama o handler `scheduled` do Worker. Então o caminho para ter cron num
 * app Next é este — embrulhar o worker gerado e acrescentar o `scheduled`.
 *
 * O `fetch` é repassado inteiro, sem tocar em nada.
 *
 * Este arquivo fica fora do `tsc --noEmit` do projeto (ver tsconfig.json):
 * ele importa `.open-next/worker.js`, que só existe DEPOIS do build do
 * adaptador. Quem o compila é o wrangler, na hora do deploy.
 */

// @ts-expect-error — gerado por `opennextjs-cloudflare build`, não existe no repositório
import { default as handler } from "./.open-next/worker.js";

const worker = {
  fetch: handler.fetch,

  /**
   * A remessa diária de e-mails de cobrança.
   *
   * Chama a rota interna pelo PRÓPRIO handler, em processo, em vez de um
   * fetch pela internet: não gasta uma volta na rede, não depende do DNS
   * estar certo e não corre risco de o Worker chamar a si mesmo em laço.
   *
   * O segredo vai no header porque a rota é pública — ela precisa recusar
   * quem não for o cron. É o mesmo desenho do webhook do Asaas.
   *
   * `ctx.waitUntil` mantém o Worker vivo até a remessa terminar; sem ele a
   * execução poderia ser cortada no meio do envio.
   */
  async scheduled(
    _evento: ScheduledController,
    env: CloudflareEnv,
    ctx: ExecutionContext,
  ): Promise<void> {
    const remessa = async () => {
      const req = new Request("https://courte.com.br/api/cron/cobrancas", {
        method: "POST",
        headers: { "x-cron-segredo": env.CRON_SEGREDO ?? "" },
      });
      const r = await handler.fetch(req, env, ctx);
      // Só o resumo (contagens), nunca o conteúdo de e-mail nenhum.
      console.log("cron cobrancas:", r.status, await r.text());
    };

    ctx.waitUntil(remessa());
  },
};

export default worker;
