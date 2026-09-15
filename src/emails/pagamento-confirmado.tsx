/**
 * Confirmação de pagamento.
 *
 * Sai pelo WEBHOOK, não pelo cron: a pessoa acabou de pagar e quer a
 * confirmação agora. Chegar na manhã seguinte seria péssimo — no intervalo
 * ela fica na dúvida se o pagamento passou, e às vezes paga de novo.
 *
 * Mesmas restrições de e-mail das outras peças (sem fonte externa, raio
 * pequeno, nada que dependa de imagem carregar).
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

/** Tudo em texto ja formatado — ver a nota em cobranca.tsx. */
export type PagamentoConfirmadoProps = {
  nome: string;
  numero: string;
  descricao: string;
  /** Ja em reais, sem o "R$". */
  valor: string;
  /**
   * Como pagou, por extenso: "Pix", "cartao", "boleto". String vazia quando
   * o Asaas nao disse — ai a frase simplesmente nao menciona a forma.
   */
  forma: string;
  url: string;
};

export function PagamentoConfirmado({
  nome,
  numero,
  descricao,
  valor,
  forma,
  url,
}: PagamentoConfirmadoProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Pagamento confirmado — obrigado!</Preview>
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
                color: cor.ink,
              }}
            >
              Pagamento confirmado
            </Heading>

            <Text
              style={{
                margin: "16px 0 0",
                fontSize: "16px",
                lineHeight: "1.6",
                color: cor.ink,
              }}
            >
              Obrigado, {nome}. Recebi o seu pagamento
              {forma ? ` por ${forma}` : ""} e a fatura já está quitada.
            </Text>

            <Section
              style={{
                marginTop: "28px",
                backgroundColor: cor.wash,
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
                  color: cor.ink,
                }}
              >
                R$ {valor}
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
                Ver o recibo
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
              O recibo fica guardado no portal e você pode imprimir quando
              precisar. Não emito nota fiscal.
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

export default PagamentoConfirmado;
