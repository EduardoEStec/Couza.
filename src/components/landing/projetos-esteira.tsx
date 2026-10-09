"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Seta } from "@/components/ui";

/**
 * Projetos numa esteira continua: a faixa desliza devagar para a esquerda,
 * em loop infinito, sem prender a rolagem da pagina. A pessoa tambem controla:
 *
 * - Setas ← → (computador): desliza um projeto por clique, com curva suave.
 * - Arrastar (dedo no celular, mouse no computador): a faixa segue o gesto e,
 *   ao soltar, continua no embalo ate voltar sozinha ao ritmo normal.
 * - Trackpad de lado (ou Shift + roda): move a faixa.
 * - Mouse em cima: desacelera ate parar, para olhar com calma.
 * - Fora da tela ou aba escondida: nao anima.
 * - "Reduzir movimento" ligado: nao anda sozinha; setas e arraste continuam.
 *
 * O loop usa DUAS copias da lista lado a lado; a posicao vive no intervalo
 * [0, largura de uma copia) e da a volta sem emenda visivel, para os dois lados.
 * A segunda copia continua CLICAVEL (depois da primeira volta, o card que a
 * pessoa ve costuma ser o da copia), mas fica fora do leitor de tela
 * (aria-hidden) e do Tab (tabindex=-1 nos links), para nao repetir tudo.
 */

/** Velocidade da esteira, em px por segundo. */
const VELOCIDADE = 38;
/** Quanto a velocidade acompanha o alvo por quadro (parar/voltar/embalo suave). */
const SUAVIZAR = 0.05;
/** Duracao do deslize de um projeto pelas setas, em ms. */
const DESLIZE = 700;
/** Depois de mexer na faixa, espera isso (ms) antes de voltar a andar sozinha. */
const RETOMAR = 2500;
/** Arraste menor que isso (px) ainda conta como clique no card. */
const TOLERANCIA_CLIQUE = 6;

/** --ease-inout-soft do quadro "Movimento" (cubic-bezier(0.65, 0, 0.35, 1)), aproximada. */
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export function ProjetosEsteira({
  id,
  cabecalho,
  cartoes,
}: {
  id: string;
  cabecalho: ReactNode;
  cartoes: ReactNode[];
}) {
  const faixaRef = useRef<HTMLDivElement>(null);
  const trilhoRef = useRef<HTMLDivElement>(null);
  const primeiraRef = useRef<HTMLDivElement>(null);
  const copiaRef = useRef<HTMLDivElement>(null);
  const deslizarRef = useRef<(direcao: 1 | -1) => void>(() => {});

  useEffect(() => {
    const faixa = faixaRef.current;
    const trilho = trilhoRef.current;
    const primeira = primeiraRef.current;
    if (!faixa || !trilho || !primeira) return;
    copiaRef.current
      ?.querySelectorAll<HTMLElement>("a, button, [tabindex]")
      .forEach((el) => el.setAttribute("tabindex", "-1"));
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ritmo = reduzir ? 0 : VELOCIDADE;

    let largura = 0; // uma copia da lista + o espaco ate a proxima
    let passo = 0; // um card + o espaco
    let x = 0;
    let velocidade = ritmo;
    let alvo = ritmo;
    let visivel = false;
    let quadro = 0;
    let anterior = 0;
    let mouseEmCima = false;
    let pausaAte = 0; // depois de mexer, espera antes de voltar a andar
    let deslize: { de: number; para: number; inicio: number } | null = null;

    // Arraste
    let arrastando = false;
    let idPonteiro = -1;
    let ultimoX = 0;
    let ultimoT = 0;
    let velArraste = 0;
    let moveu = 0;

    const dentroDoLoop = (v: number) => (largura ? ((v % largura) + largura) % largura : v);
    const medir = () => {
      const espaco = parseFloat(getComputedStyle(trilho).columnGap) || 0;
      largura = primeira.offsetWidth + espaco;
      const card = primeira.firstElementChild as HTMLElement | null;
      passo = card ? card.offsetWidth + espaco : 0;
      desenhar();
    };
    const desenhar = () => {
      trilho.style.transform = `translate3d(${-dentroDoLoop(x)}px, 0, 0)`;
    };

    const atualizarAlvo = (agora: number) => {
      alvo = mouseEmCima || arrastando || agora < pausaAte ? 0 : ritmo;
    };

    const tique = (agora: number) => {
      quadro = 0;
      const dt = anterior ? Math.min(0.05, (agora - anterior) / 1000) : 0;
      anterior = agora;
      if (deslize) {
        const t = Math.min(1, (agora - deslize.inicio) / DESLIZE);
        x = deslize.de + (deslize.para - deslize.de) * easeInOut(t);
        if (t >= 1) {
          deslize = null;
          velocidade = 0; // recomeca do zero, sem tranco
        }
      } else if (!arrastando) {
        atualizarAlvo(agora);
        velocidade += (alvo - velocidade) * SUAVIZAR;
        x += velocidade * dt;
      }
      desenhar();
      if (visivel && !document.hidden) quadro = requestAnimationFrame(tique);
    };
    const comecar = () => {
      if (!quadro && visivel && !document.hidden) {
        anterior = 0;
        quadro = requestAnimationFrame(tique);
      }
    };
    const segurar = () => {
      pausaAte = performance.now() + RETOMAR;
    };

    // Setas: um projeto para cada lado, sempre parando alinhado a um card.
    const deslizar = (direcao: 1 | -1) => {
      if (!passo) return;
      const base = deslize ? deslize.para : x;
      const alinhado = direcao > 0 ? Math.floor(base / passo + 0.001) + 1 : Math.ceil(base / passo - 0.001) - 1;
      deslize = { de: x, para: alinhado * passo, inicio: performance.now() };
      segurar();
      comecar();
    };
    deslizarRef.current = deslizar;

    // Arraste com dedo ou mouse. No toque, `touch-action: pan-y` deixa a
    // rolagem vertical da pagina com o navegador e manda o lateral para ca.
    const aoApertar = (e: PointerEvent) => {
      if (e.button !== 0 || arrastando) return;
      arrastando = true;
      idPonteiro = e.pointerId;
      ultimoX = e.clientX;
      ultimoT = performance.now();
      velArraste = 0;
      moveu = 0;
      deslize = null;
      velocidade = 0;
    };
    const aoMover = (e: PointerEvent) => {
      if (!arrastando || e.pointerId !== idPonteiro) return;
      const agora = performance.now();
      const dx = e.clientX - ultimoX;
      moveu += Math.abs(dx);
      if (moveu > TOLERANCIA_CLIQUE && !faixa.hasPointerCapture(e.pointerId)) {
        faixa.setPointerCapture(e.pointerId);
        faixa.dataset.arrastando = "";
      }
      x -= dx;
      const dt = Math.max(1, agora - ultimoT);
      velArraste = velArraste * 0.6 + (-dx / dt) * 1000 * 0.4; // px/s, suavizado
      ultimoX = e.clientX;
      ultimoT = agora;
      desenhar();
    };
    const aoSoltar = (e: PointerEvent) => {
      if (!arrastando || e.pointerId !== idPonteiro) return;
      arrastando = false;
      delete faixa.dataset.arrastando;
      // Embalo: sai na velocidade do gesto e desacelera ate o ritmo normal.
      velocidade = Math.max(-2500, Math.min(2500, velArraste));
      segurar();
      comecar();
    };
    // Depois de arrastar, o soltar nao pode virar clique no card.
    const aoClicar = (e: MouseEvent) => {
      if (moveu > TOLERANCIA_CLIQUE) {
        e.preventDefault();
        e.stopPropagation();
        moveu = 0;
      }
    };

    // Trackpad de lado (ou Shift + roda).
    const aoRodar = (e: WheelEvent) => {
      const lateral = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
      if (!lateral) return;
      e.preventDefault();
      e.stopPropagation(); // o scroll suave da pagina nao rola junto
      deslize = null;
      x += lateral;
      velocidade = 0;
      segurar();
      desenhar();
      comecar();
    };

    // Pausa no hover so com mouse (no toque nao existe "sair de cima").
    const aoEntrar = (e: PointerEvent) => {
      if (e.pointerType === "mouse") mouseEmCima = true;
    };
    const aoSair = (e: PointerEvent) => {
      if (e.pointerType === "mouse") mouseEmCima = false;
    };

    const observarTela = new IntersectionObserver(([entrada]) => {
      visivel = entrada.isIntersecting;
      comecar();
    });
    const observarTamanho = new ResizeObserver(medir);

    medir();
    observarTela.observe(faixa);
    observarTamanho.observe(primeira);
    faixa.addEventListener("pointerdown", aoApertar);
    faixa.addEventListener("pointermove", aoMover);
    faixa.addEventListener("pointerup", aoSoltar);
    faixa.addEventListener("pointercancel", aoSoltar);
    faixa.addEventListener("click", aoClicar, { capture: true });
    faixa.addEventListener("wheel", aoRodar, { passive: false });
    faixa.addEventListener("pointerenter", aoEntrar);
    faixa.addEventListener("pointerleave", aoSair);
    document.addEventListener("visibilitychange", comecar);

    return () => {
      cancelAnimationFrame(quadro);
      observarTela.disconnect();
      observarTamanho.disconnect();
      faixa.removeEventListener("pointerdown", aoApertar);
      faixa.removeEventListener("pointermove", aoMover);
      faixa.removeEventListener("pointerup", aoSoltar);
      faixa.removeEventListener("pointercancel", aoSoltar);
      faixa.removeEventListener("click", aoClicar, { capture: true });
      faixa.removeEventListener("wheel", aoRodar);
      faixa.removeEventListener("pointerenter", aoEntrar);
      faixa.removeEventListener("pointerleave", aoSair);
      document.removeEventListener("visibilitychange", comecar);
    };
  }, []);

  const lista = (copia: boolean) =>
    cartoes.map((cartao, i) => (
      <div key={`${copia ? "b" : "a"}-${i}`} className="flex w-[300px] shrink-0 sm:w-[420px] lg:w-[500px]">
        {cartao}
      </div>
    ));

  const seta =
    "group flex h-12 w-12 items-center justify-center rounded-pill border border-line bg-white text-ink transition-colors duration-200 ease-out-soft hover:border-ink hover:bg-ink hover:text-white";

  return (
    <section id={id} className="py-14 lg:py-30">
      <div className="mx-auto flex w-full max-w-[1280px] items-end justify-between gap-6 px-5 sm:px-8 lg:px-14">
        {/* Num wrapper proprio: solto ao lado das setas, o React acusava "key" ausente. */}
        <div className="min-w-0">{cabecalho}</div>
        <div className="hidden shrink-0 gap-2.5 sm:flex">
          <button type="button" aria-label="Projeto anterior" className={seta} onClick={() => deslizarRef.current(-1)}>
            <span className="rotate-180">
              <Seta />
            </span>
          </button>
          <button type="button" aria-label="Próximo projeto" className={seta} onClick={() => deslizarRef.current(1)}>
            <Seta />
          </button>
        </div>
      </div>

      {/* Bordas esmaecidas: os cards entram e saem suavemente pelas laterais. */}
      <div
        ref={faixaRef}
        className="mt-7 cursor-grab touch-pan-y overflow-hidden py-3 select-none data-[arrastando]:cursor-grabbing [&_a]:cursor-pointer data-[arrastando]:[&_a]:cursor-grabbing lg:mt-12 [&_a]:[-webkit-user-drag:none] [&_img]:pointer-events-none"
        style={{
          maskImage: "linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)",
        }}
      >
        <div ref={trilhoRef} className="flex w-max gap-4 will-change-transform lg:gap-6">
          <div ref={primeiraRef} className="flex gap-4 lg:gap-6">
            {lista(false)}
          </div>
          {/* Copia para o loop sem emenda. */}
          <div ref={copiaRef} className="flex gap-4 lg:gap-6" aria-hidden>
            {lista(true)}
          </div>
        </div>
      </div>
    </section>
  );
}
