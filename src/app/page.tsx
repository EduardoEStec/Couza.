import { Nav } from "@/components/landing/nav";
import { ScrollSuave } from "@/components/movimento";
import {
  ComoFunciona,
  Hero,
  Servicos,
  Trabalhos,
} from "@/components/landing/secoes";
import { Duvidas } from "@/components/landing/duvidas";
import { CtaFinal, Rodape } from "@/components/landing/rodape";

export default function Home() {
  return (
    <>
      {/* Scroll suave so aqui: a landing e a unica tela longa. No portal
          ele custaria 44 KB de JS para nao fazer diferenca nenhuma. */}
      <ScrollSuave />
      <Nav />
      <main>
        <Hero />
        <Servicos />
        <ComoFunciona />
        <Trabalhos />
        <Duvidas />
        <CtaFinal />
      </main>
      <Rodape />
    </>
  );
}
