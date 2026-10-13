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
import { duvidas, ehFalta, marca, quemSomos, servicos } from "@/content/site";

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
      description:
        "Desenvolvimento de sistemas sob medida, software personalizado e criação de sites em São Paulo.",
      knowsAbout: [
        "Sistemas sob medida",
        "Software personalizado",
        "Sistemas web",
        "Sistemas de gestão",
        "Integração de sistemas",
        "Criação de sites",
        "Landing pages",
        "Manutenção de sites",
      ],
      founder: quemSomos.pessoas.map((p) => ({
        "@type": "Person",
        name: p.nome,
        jobTitle: p.funcao,
      })),
      // Servicos e perguntas saem do mesmo texto da pagina: IA e busca so
      // devem ler o que o visitante tambem le.
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Serviços",
        itemListElement: servicos.itens.map((s) => ({
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: s.titulo,
            provider: { "@id": "https://couza.com.br/#empresa" },
            description: s.texto,
          },
        })),
      },
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
    {
      "@type": "FAQPage",
      "@id": "https://couza.com.br/#duvidas",
      // Pergunta com falta() na resposta fica de fora ate ser preenchida.
      mainEntity: duvidas.itens
        .filter((d) => !d.resposta.some(ehFalta))
        .map((d) => ({
          "@type": "Question",
          name: d.pergunta,
          acceptedAnswer: { "@type": "Answer", text: d.resposta.join("") },
        })),
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
