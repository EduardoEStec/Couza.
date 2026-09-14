import { Nav } from "@/components/landing/nav";
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
