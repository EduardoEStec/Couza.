import type { Metadata } from "next";
import { Nav } from "@/components/landing/nav";
import { ScrollSuave } from "@/components/movimento";
import { Duvidas } from "@/components/landing/duvidas";
import { CtaFinal, Rodape } from "@/components/landing/rodape";
import { Caso, Funcoes, HeroRestaurantes, Telas } from "@/components/restaurantes/secoes";
import {
  restCta,
  restDuvidas,
  restFuncoes,
  restHero,
  restNav,
} from "@/content/restaurantes";

// RASCUNHO, como o resto da copy desta pagina (ver src/content/restaurantes.ts).
export const metadata: Metadata = {
  title: "Couza · Restaurantes — Sistema para restaurante com comandas e cardápio digital",
  description:
    "Sistema para restaurante, bar e espetaria: comandas por mesa, controle de caixa, estoque que baixa sozinho e cardápio digital, com a marca da sua casa.",
  keywords: [
    "sistema para restaurante",
    "sistema para bar",
    "sistema de comandas",
    "comanda eletrônica",
    "cardápio digital",
    "controle de estoque para restaurante",
    "controle de caixa",
    "sistema de gestão para restaurante",
  ],
  alternates: { canonical: "/restaurantes" },
  // O openGraph da pagina SUBSTITUI o do layout (nao mescla): repete o basico.
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Couza",
    title: "Couza · Restaurantes — Sistema para restaurante com comandas e cardápio digital",
    description:
      "Sistema para restaurante, bar e espetaria: comandas por mesa, controle de caixa, estoque que baixa sozinho e cardápio digital, com a marca da sua casa.",
    url: "/restaurantes",
  },
};

/** Dados estruturados (schema.org), montados do mesmo texto da pagina. */
const dadosEstruturados = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": "https://couza.com.br/restaurantes#sistema",
      name: restHero.nome,
      description: restHero.texto,
      url: "https://couza.com.br/restaurantes",
      applicationCategory: "BusinessApplication",
      inLanguage: "pt-BR",
      featureList: restFuncoes.itens.map((f) => f.titulo),
      screenshot: `https://couza.com.br${restHero.imagem.src}`,
      publisher: { "@id": "https://couza.com.br/#empresa" },
    },
    {
      "@type": "FAQPage",
      "@id": "https://couza.com.br/restaurantes#duvidas",
      mainEntity: restDuvidas.itens.map((d) => ({
        "@type": "Question",
        name: d.pergunta,
        acceptedAnswer: { "@type": "Answer", text: d.resposta.join("") },
      })),
    },
  ],
};

// Pagina estatica: nada aqui depende da requisicao, entao sai como asset e
// nao invoca o Worker.
export default function Restaurantes() {
  return (
    <>
      <script
        type="application/ld+json"
        // JSON fixo, montado aqui mesmo: nenhum dado de usuario entra nele.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dadosEstruturados) }}
      />
      <ScrollSuave />
      <Nav links={restNav} />
      <main>
        <HeroRestaurantes />
        <Funcoes />
        <Telas />
        <Caso />
        <Duvidas dados={restDuvidas} />
        <CtaFinal dados={restCta} />
      </main>
      <Rodape />
    </>
  );
}
