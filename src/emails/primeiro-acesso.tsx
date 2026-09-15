/**
 * E-mail de primeiro acesso — quadro "E-mail · primeiro acesso" do canvas.
 *
 * Restricoes de e-mail respeitadas, e elas explicam o que parece feio aqui:
 * - sem Jost: Gmail e Outlook nao carregam fonte externa
 * - sem raio grande nos blocos: o Outlook do Windows renderiza com o motor
 *   do Word e ignora border-radius (o botao em 8px passa)
 * - tudo que importa e TEXTO, nunca imagem — imagem pode vir bloqueada.
 *   Por isso o "courte." e tipografado, nao um PNG
 * - o endereco do link aparece escrito, porque botao em e-mail falha mais
 *   do que se imagina
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
} from "@react-email/components";
import { pixelBasedPreset } from "@react-email/components";
import { cor, temaEmail } from "@/lib/tokens";

export type PrimeiroAcessoProps = {
  nome: string;
  url: string;
  validadeTexto: string;
};

export function PrimeiroAcesso({ nome, url, validadeTexto }: PrimeiroAcessoProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Seu acesso ao Portal do Cliente da courte</Preview>
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
              Seu acesso ao portal
            </Heading>

            <Text
              style={{
                margin: "16px 0 0",
                fontSize: "16px",
                lineHeight: "1.6",
                color: cor.ink,
              }}
            >
              Olá, {nome}. Clique no botão abaixo para criar a sua senha e entrar
              no Portal do Cliente.
            </Text>

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
                Criar minha senha
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
              O link vale por {validadeTexto} e só pode ser usado uma vez. Se você
              não pediu isso, pode ignorar este e-mail — nada acontece.
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
                fontSize: "15px",
                lineHeight: "1.6",
                color: cor.n1,
              }}
            >
              Copie e cole este endereço no navegador:
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
              style={{
                margin: 0,
                fontSize: "13px",
                lineHeight: "1.7",
                color: cor.n1,
              }}
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

export default PrimeiroAcesso;
