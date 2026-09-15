import type { Metadata } from "next";
import { Jost } from "next/font/google";
import "./globals.css";

// Jost 400/500/600, como no quadro "Tokens". O next/font baixa e serve local,
// entao nao ha requisicao ao Google em runtime.
const jost = Jost({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-jost",
  display: "swap",
});

// RASCUNHO: textos de metadata sao provisorios, como o resto da copy.
export const metadata: Metadata = {
  title: "courte",
  description:
    "Desenvolvimento de sites e sistemas sob medida, com portal do cliente para acompanhar produtos, faturas e pagamentos.",
  // O favicon mora em public/, nao em src/app/icon.svg. A convencao do Next
  // publica o arquivo como rota (/icon.svg), e rota e servida pelo Worker:
  // toda primeira visita ao site pagaria uma invocacao so para buscar o
  // icone. Em public/ ele vira asset estatico, servido pelo binding ASSETS
  // da Cloudflare, que nao invoca o Worker nem conta para a cota diaria.
  // Conferido em 15/09/2026 em .open-next/assets apos os dois builds.
  //
  // Dois arquivos, nesta ordem, de proposito. O Safari (Mac e iPhone) nao
  // le favicon em SVG; sem o .ico a aba dele ficaria com o icone generico.
  // Chrome, Firefox e Edge escolhem o SVG, que e nitido em qualquer zoom;
  // o Safari cai no .ico. O .ico traz 16, 32 e 48 px.
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={jost.variable}>
      <body>
        {/*
          O ScrollSuave NAO mora aqui.
          Ele vive em src/app/page.tsx, so na landing. Importar
          @/components/movimento neste layout puxava o modulo inteiro —
          Motion junto — para o pacote compartilhado, e ai toda tela do
          portal baixava 44 KB de biblioteca de animacao sem ter animacao
          nenhuma. Medido em 15/09/2026.
        */}
        {children}
      </body>
    </html>
  );
}
