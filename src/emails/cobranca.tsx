/**
 * E-mail de cobrança — serve aos três momentos: nova, lembrete e vencida.
 *
 * Um arquivo só pelo mesmo motivo do link-acesso: a peça é idêntica, muda a
 * copy. Três arquivos quase iguais divergiriam no dia em que alguém mexesse
 * num só.
 *
 * As restrições de e-mail são as mesmas da outra peça e explicam o que
 * parece feio aqui:
 * - sem Jost: Gmail e Outlook não carregam fonte externa
 * - raio de 8px no botão, que é o que o motor do Word (Outlook do Windows)
 *   tolera; nada de raio grande em bloco
 * - tudo que importa é TEXTO, nunca imagem — imagem pode vir bloqueada, e
 *   valor de cobrança não pode depender disso
 * - o endereço aparece escrito embaixo, porque botão em e-mail falha mais
 *   do que se imagina
 *
 * O botão leva ao MEU checkout, nunca ao site do Asaas — exigência do
 * ETAPAS.md. Como a rota é logada, quem não estiver logado cai no login e
 * volta para a fatura certa depois de entrar.
 */

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
  pixelBasedPreset,
} from "@react-email/components";
import { cor, temaEmail } from "@/lib/tokens";
import { emDataBr, emReais } from "@/lib/dinheiro";

export type MomentoCobranca =
  | "cobranca_nova"
  | "cobranca_lembrete"
  | "cobranca_vencida";

export type CobrancaProps = {
  nome: string;
  numero: number;
  descricao: string;
  valorCentavos: number;
  vencimento: string;
  url: string;
  momento: MomentoCobranca;
};

const copy = {
  cobranca_nova: {
    preview: "Uma nova cobrança no seu Portal do Cliente",
    titulo: "Nova cobrança",
    corpo: "Registrei esta cobrança no seu portal. Você pode pagar por lá com cartão, Pix ou boleto.",
    rotuloData: "Vence em",
    destaque: false,
  },
  cobranca_lembrete: {
    preview: "Sua cobrança vence em 3 dias",
    titulo: "Vence em 3 dias",
    corpo: "Passando só para lembrar. Se já pagou, pode ignorar este e-mail — a baixa pode levar algumas horas para aparecer.",
    rotuloData: "Vence em",
    destaque: false,
  },
  cobranca_vencida: {
    preview: "Uma cobrança sua passou do vencimento",
    titulo: "Cobrança vencida",
    corpo: "Esta cobrança passou do vencimento e continua em aberto. Se já pagou ou se houve algum problema, é só me responder que eu resolvo.",
    rotuloData: "Venceu em",
    destaque: true,
  },
} as const;

export function Cobranca({
  nome,
  numero,
  descricao,
  valorCentavos,
  vencimento,
  url,
  momento,
}: CobrancaProps) {
  const t = copy[momento];

  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>{t.preview}</Preview>
      <Tailwind config={{ presets: [pixelBasedPreset], ...temaEmail }}>
        <Body style={{ backgroundColor: "#e9e9e9", margin: 0, padding: 0 }}>
          <Container
            style={{ backgroundColor: cor.bg, maxWidth: "600px", padding: "40px" }}
          >
            <Text
              style={{
                margin: 0,
                fontSize: "22px",
                fontWeight: 600,
                letterSpacing: "-0.04em",
                color: cor.ink,
              }}
            >
              courte<span style={{ color: cor.acc }}>.</span>
            </Text>

            <Heading
              as="h1"
              style={{
                margin: "36px 0 0",
                fontSize: "28px",
                fontWeight: 500,
                letterSpacing: "-0.03em",
                lineHeight: "1.15",
                color: t.destaque ? cor.danger : cor.ink,
              }}
            >
              {t.titulo}
            </Heading>

            <Text
              style={{
                margin: "16px 0 0",
                fontSize: "16px",
                lineHeight: "1.6",
                color: cor.ink,
              }}
            >
              Olá, {nome}. {t.corpo}
            </Text>

            {/* O quadro do valor. Tabela, não flex: Outlook ignora flex. */}
            <Section
              style={{
                marginTop: "28px",
                backgroundColor: t.destaque ? cor.dangerWash : cor.wash,
                borderRadius: "8px",
                padding: "24px",
              }}
            >
              <Text
                style={{
                  margin: 0,
                  fontSize: "12px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: cor.n1,
                }}
              >
                Fatura nº {numero}
              </Text>
              <Text
                style={{
                  margin: "10px 0 0",
                  fontSize: "16px",
                  lineHeight: "1.5",
                  color: cor.ink,
                }}
              >
                {descricao}
              </Text>
              <Text
                style={{
                  margin: "14px 0 0",
                  fontSize: "32px",
                  fontWeight: 600,
                  letterSpacing: "-0.03em",
                  color: t.destaque ? cor.danger : cor.ink,
                }}
              >
                R$ {emReais(valorCentavos)}
              </Text>
              <Text
                style={{
                  margin: "6px 0 0",
                  fontSize: "15px",
                  lineHeight: "1.6",
                  color: cor.n1,
                }}
              >
                {t.rotuloData} {emDataBr(vencimento)}
              </Text>
            </Section>

            <Section style={{ marginTop: "28px" }}>
              <Link
                href={url}
                style={{
                  backgroundColor: cor.acc,
                  color: "#ffffff",
                  fontSize: "16px",
                  fontWeight: 500,
                  padding: "15px 28px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                Pagar agora
              </Link>
            </Section>

            <Text
              style={{
                margin: "14px 0 0",
                fontSize: "15px",
                lineHeight: "1.6",
                color: cor.n1,
              }}
            >
              No portal você paga com cartão, Pix ou boleto, e o comprovante
              fica guardado lá.
            </Text>

            <Hr style={{ borderColor: cor.line, margin: "32px 0" }} />

            <Text
              style={{
                margin: 0,
                fontSize: "12px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: cor.n1,
              }}
            >
              Se o botão não funcionar
            </Text>
            <Text
              style={{
                margin: "10px 0 0",
                backgroundColor: cor.wash,
                borderRadius: "8px",
                padding: "14px",
                fontSize: "13px",
                lineHeight: "1.6",
                wordBreak: "break-all",
                color: cor.ink,
              }}
            >
              {url}
            </Text>
          </Container>

          <Container
            style={{
              backgroundColor: cor.wash,
              maxWidth: "600px",
              padding: "28px 40px",
            }}
          >
            <Text
              style={{ margin: 0, fontSize: "13px", lineHeight: "1.7", color: cor.n1 }}
            >
              Você recebeu este e-mail porque tem um produto contratado comigo.
              <br />
              courte.com.br
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default Cobranca;
