import type { Metadata } from "next";
import { Nav } from "@/components/landing/nav";
import { ScrollSuave } from "@/components/movimento";
import { Duvidas } from "@/components/landing/duvidas";
import { CtaFinal, Rodape } from "@/components/landing/rodape";
import { Caso, Funcoes, HeroRestaurantes, Telas } from "@/components/restaurantes/secoes";
import { restCta, restDuvidas, restNav } from "@/content/restaurantes";

// RASCUNHO, como o resto da copy desta pagina (ver src/content/restaurantes.ts).
export const metadata: Metadata = {
  title: "Couza · Restaurantes",
  description:
    "Sistema para restaurantes: comandas, caixa, estoque e cardápio digital num sistema só.",
};

// Pagina estatica: nada aqui depende da requisicao, entao sai como asset e
// nao invoca o Worker.
export default function Restaurantes() {
  return (
    <>
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
