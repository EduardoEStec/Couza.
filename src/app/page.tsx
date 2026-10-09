import type { Metadata } from "next";
import { Nav } from "@/components/landing/nav";
import { ScrollSuave } from "@/components/movimento";
import {
  ComoFunciona,
  Experimente,
  Hero,
  QuemSomos,
  Servicos,
  Trabalhos,
} from "@/components/landing/secoes";
import { Duvidas } from "@/components/landing/duvidas";
import { CtaFinal, Rodape } from "@/components/landing/rodape";
import { marca } from "@/content/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/**
 * Dados estruturados (schema.org) para o Google ligar a busca "couza" a este
 * site: quem e a empresa, qual o endereco oficial, logo e contato. Os dados
 * vem de `marca` (rodape), para nao divergir do que a pagina mostra.
 */
const dadosEstruturados = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://couza.com.br/#empresa",
      name: "Couza",
      alternateName: "couza",
      url: "https://couza.com.br/",
      logo: "https://couza.com.br/icon.svg",
      description: "Sites e sistemas sob medida.",
      email: marca.email,
      telephone: "+55 11 92484-1502",
      address: {
        "@type": "PostalAddress",
        addressLocality: "São Paulo",
        addressRegion: "SP",
        addressCountry: "BR",
      },
    },
    {
      "@type": "WebSite",
      "@id": "https://couza.com.br/#site",
      name: "Couza",
      alternateName: "couza",
      url: "https://couza.com.br/",
      inLanguage: "pt-BR",
      publisher: { "@id": "https://couza.com.br/#empresa" },
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        // JSON fixo, montado aqui mesmo: nenhum dado de usuario entra nele.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dadosEstruturados) }}
      />
      {/* Scroll suave so aqui: a landing e a unica tela longa. No portal
          ele custaria 44 KB de JS para nao fazer diferenca nenhuma. */}
      <ScrollSuave />
      <Nav />
      <main>
        <Hero />
        <Servicos />
        <ComoFunciona />
        <Trabalhos />
        <Experimente />
        <QuemSomos />
        <Duvidas />
        <CtaFinal />
      </main>
      <Rodape />
    </>
  );
}
