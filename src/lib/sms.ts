/**
 * SMS — DESLIGADO por padrão, atrás de `SMS_ATIVO`.
 *
 * O ETAPAS.md é explícito: "deixe pronto para ligar, mas DESLIGADO por
 * padrão... É cobrado por envio e só vou ativar depois. Não gaste tempo com
 * isso além do mínimo." Então aqui tem o mínimo mesmo.
 *
 * Nenhum provedor foi escolhido — essa decisão é do Guilherme, e escolher
 * por ele seria inventar custo recorrente. Quando ele decidir, o único
 * lugar a mexer é `despachar()` abaixo; o resto do sistema já chama
 * `mandarSms()` sem saber quem entrega.
 *
 * O padrão é desligado de forma segura: só a string "true" liga. Variável
 * ausente, vazia, "false", "0" ou qualquer digitação errada = desligado.
 * Com dinheiro por envio, o erro tem que cair para o lado de não mandar.
 */

export function smsAtivo(): boolean {
  return process.env.SMS_ATIVO === "true";
}

export type ResultadoSms =
  | { ok: true }
  | { ok: false; erro: string }
  | { ok: "desligado" };

export async function mandarSms(
  _telefone: string,
  _texto: string,
): Promise<ResultadoSms> {
  if (!smsAtivo()) return { ok: "desligado" };

  return {
    ok: false,
    erro:
      "SMS_ATIVO está ligado, mas nenhum provedor foi configurado. " +
      "Escolha o provedor e implemente o envio em src/lib/sms.ts.",
  };
}
