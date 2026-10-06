import { acharDestino, criarLink, podePedirLink } from "@/db/tokens";
import { enviarEmail, urlBase } from "@/lib/email";
import { montarLinkAcesso } from "@/lib/email-html";

/**
 * Manda o link de acesso, e NUNCA conta para quem chamou o que aconteceu.
 *
 * O retorno e void de proposito: se devolvesse "achei" ou "nao achei", em
 * algum momento alguem usaria isso para variar a mensagem da tela, e a
 * lista de clientes do Guilherme sairia de graca para quem testasse
 * endereco por endereco.
 *
 * O `pedido` diz de qual tela veio, mas quem decide o texto do e-mail e o
 * estado da conta: se o usuario ainda nao existe, mesmo vindo de "esqueci a
 * senha", o que faz sentido mandar e o de primeiro acesso — nao da para
 * recuperar uma senha que nunca foi criada.
 */
export async function mandarLinkDeAcesso(
  email: string,
  pedido: "primeiro_acesso" | "recuperar_senha",
): Promise<void> {
  const destino = await acharDestino(email);
  if (!destino) return;

  const tipo =
    pedido === "recuperar_senha" && destino.usuarioId
      ? "recuperar_senha"
      : "primeiro_acesso";

  // Trava de 60s por conta: impede transformar o formulario em maquina de
  // encher a caixa de entrada de um cliente.
  if (!(await podePedirLink(destino.clienteId, tipo))) return;

  const token = await criarLink(destino.clienteId, destino.usuarioId, tipo);

  // Peca ja renderizada no build; aqui e so troca de texto. O primeiro
  // acesso e uma tela que a pessoa espera carregar, entao renderizar React
  // aqui gastaria do mesmo orcamento de 10ms que o login inteiro tem.
  const html = montarLinkAcesso(tipo, {
    nome: destino.nome,
    url: `${urlBase()}/portal/criar-senha/${token}`,
    validade: "1 hora",
  });

  await enviarEmail({
    para: destino.email,
    assunto:
      tipo === "recuperar_senha"
        ? "Criar uma senha nova — Portal do Cliente couza"
        : "Seu acesso ao Portal do Cliente — couza",
    html,
    tipo,
    clienteId: destino.clienteId,
  });
}
