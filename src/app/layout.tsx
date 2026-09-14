import type { Metadata } from "next";
import { Jost } from "next/font/google";
import { ScrollSuave } from "@/components/movimento";
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
  title: "courte — sites e sistemas sob medida",
  description:
    "Desenvolvimento de sites e sistemas sob medida, com portal do cliente para acompanhar produtos, faturas e pagamentos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={jost.variable}>
      <body>
        <ScrollSuave />
        {children}
      </body>
    </html>
  );
}
