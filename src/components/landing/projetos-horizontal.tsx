"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { pegarLenis } from "@/components/movimento";

/**
 * Projetos como uma etapa horizontal dentro da rolagem vertical.
 *
 * A secao fica presa na tela (sticky) e a rolagem vertical arrasta os
 * projetos para o lado EM TEMPO REAL. Quando o gesto termina, o trilho
 * assenta no projeto mais proximo (snap), puxando para o lado em que a
 * pessoa ia. Regras:
 *  - um gesto nunca anda mais de um projeto;
 *  - chegando de fora com embalo, a rolagem desacelera ate parar no
 *    primeiro (descendo) ou no ultimo projeto (subindo), sem salto;
 *  - so libera a pagina num gesto NOVO que comeca no ultimo projeto
 *    (descendo) ou no primeiro (subindo).
 *
 * Por que nao o Snap do proprio Lenis: ele vale para a pagina inteira e
 * ignora o toque. Aqui o controle so existe dentro da faixa da secao.
 *
 * No toque o Lenis nao atua (rolagem nativa), entao cada arraste de dedo
 * vira um passo animado.
 */

function curva(x1: number, y1: number, x2: number, y2: number) {
  const eixo = (t: number, a: number, b: number) =>
    3 * a * t * (1 - t) ** 2 + 3 * b * t ** 2 * (1 - t) + t ** 3;
  return (x: number) => {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 24; i++) {
      const meio = (lo + hi) / 2;
      if (eixo(meio, x1, x2) < x) lo = meio;
      else hi = meio;
    }
    return eixo((lo + hi) / 2, y1, y2);
  };
}
/** --ease-out-soft do quadro "Movimento": assentar no projeto. */
const EASE_OUT_SOFT = curva(0.22, 0.61, 0.36, 1);
/** --ease-inout-soft do quadro "Movimento": passo inteiro (toque, tecla, bolinha). */
const EASE_INOUT_SOFT = curva(0.65, 0, 0.35, 1);

/** Duracao do assentamento depois do gesto e do passo inteiro, em segundos. */
const ASSENTAR = 0.75;
const PASSO = 0.9;
/** Silencio (ms) sem eventos de roda que marca o fim de um gesto. */
const SILENCIO = 160;
/** Mesmo multiplicador da roda do ScrollSuave, para a sensacao ser igual a do resto da pagina. */
const RODA = 0.7;
/** Suavizacao do arraste (mesmo lerp do ScrollSuave). */
const LERP = 0.09;
/** Quanto do caminho ate o vizinho basta para assentar nele (trackpad). */
const LIMIAR = 0.08;

export function ProjetosHorizontal({
  id,
  cabecalho,
  cartoes,
}: {
  id: string;
  cabecalho: ReactNode;
  cartoes: ReactNode[];
}) {
  const secaoRef = useRef<HTMLElement>(null);
  const trilhoRef = useRef<HTMLDivElement>(null);
  const bolinhasRef = useRef<HTMLDivElement>(null);
  const irParaRef = useRef<(i: number) => void>(() => {});
  const [indice, setIndice] = useState(0);
  const total = cartoes.length;

  useEffect(() => {
    const secao = secaoRef.current;
    const trilho = trilhoRef.current;
    if (!secao || !trilho || total < 2) return;

    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cartoesEl = Array.from(trilho.children) as HTMLElement[];
    const bolinhas = Array.from(bolinhasRef.current?.children ?? []) as HTMLElement[];

    let inicio = 0;
    let faixa = 1;
    let passo = 0;
    let quadro = 0;
    let indiceAtual = -1;

    // Estado do gesto de roda em andamento.
    let ultimoEvento = 0;
    let ancora = 0; // projeto onde o gesto comecou
    let minimo = 0; // limites do gesto (scroll em px)
    let maximo = 0;
    let alvo = 0; // para onde o gesto quer levar a rolagem
    let direcao = 0;
    let passoDireto = false; // gesto de roda de mouse: ja disparou o passo inteiro
    let fimGesto = 0;
    let animando = false;
    let fimAnimacao = 0;

    // Toque.
    let ultimoToque = false;
    let ultimoGesto = 0;
    let ultimoY = window.scrollY;

    const medir = () => {
      inicio = secao.getBoundingClientRect().top + window.scrollY;
      faixa = Math.max(1, secao.offsetHeight - window.innerHeight);
      passo = cartoesEl[1] ? cartoesEl[1].offsetLeft - cartoesEl[0].offsetLeft : 0;
    };
    const fim = () => inicio + faixa;
    const ponto = (i: number) => inicio + (faixa * i) / (total - 1);
    const limitar = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
    const dentro = (y: number) => y >= inicio - 2 && y <= fim() + 2;
    const posicao = (y: number) => limitar(((y - inicio) / faixa) * (total - 1), 0, total - 1);

    // Desenho por quadro: trilho, profundidade dos cartoes e bolinhas.
    const desenhar = () => {
      quadro = 0;
      const pos = posicao(window.scrollY);
      trilho.style.transform = `translate3d(${-pos * passo}px, 0, 0)`;
      cartoesEl.forEach((el, j) => {
        const d = j - pos; // <0: ja passou; >0: ainda vem
        const dist = Math.min(1, Math.abs(d));
        const corpo = el.firstElementChild as HTMLElement | null;
        if (corpo) {
          corpo.style.transform = `scale(${1 - 0.07 * dist})`;
          corpo.style.opacity = String(1 - 0.5 * dist);
        }
        const imagem = el.querySelector<HTMLElement>("[data-imagem]");
        if (imagem) imagem.style.transform = `translate3d(${d * -48}px, 0, 0) scale(1.1)`;
        const legenda = el.querySelector<HTMLElement>("[data-legenda]");
        if (legenda) legenda.style.transform = `translate3d(${d * 64}px, 0, 0)`;
      });
      bolinhas.forEach((b, j) => {
        const perto = 1 - Math.min(1, Math.abs(j - pos));
        b.style.width = `${8 + 16 * perto}px`;
        b.style.opacity = String(0.45 + 0.55 * perto);
      });
      const i = Math.round(pos);
      if (i !== indiceAtual) {
        indiceAtual = i;
        setIndice(i);
      }
    };
    const pedirDesenho = () => {
      if (!quadro) quadro = requestAnimationFrame(desenhar);
    };

    const rolar = (destino: number, modo: "arrastar" | "assentar" | "passo" | "ja") => {
      const lenis = pegarLenis();
      if (!lenis) {
        window.scrollTo({ top: destino, behavior: modo === "ja" || reduzir ? "instant" : "smooth" });
        return;
      }
      if (modo === "arrastar") lenis.scrollTo(destino, { lerp: LERP, force: true });
      else
        lenis.scrollTo(destino, {
          immediate: modo === "ja" || reduzir,
          duration: modo === "passo" ? PASSO : ASSENTAR,
          easing: modo === "passo" ? EASE_INOUT_SOFT : EASE_OUT_SOFT,
          // O passo inteiro nao pode ser cortado pelo resto do arraste do dedo.
          lock: modo === "passo",
          force: true,
        });
    };

    const irPara = (i: number) => {
      const destino = limitar(i, 0, total - 1);
      animando = true;
      window.clearTimeout(fimAnimacao);
      fimAnimacao = window.setTimeout(() => (animando = false), reduzir ? 50 : PASSO * 1000 + 60);
      rolar(ponto(destino), "passo");
    };
    irParaRef.current = irPara;

    // Fim do gesto de roda: assenta no projeto, puxando para o lado em que ia.
    const assentar = () => {
      const pos = posicao(alvo);
      const base = Math.floor(pos);
      const frac = pos - base;
      let destino = Math.round(pos);
      if (direcao > 0) destino = frac > LIMIAR ? base + 1 : base;
      else if (direcao < 0) destino = frac < 1 - LIMIAR ? base : base + 1;
      destino = limitar(destino, Math.max(0, ancora - 1), Math.min(total - 1, ancora + 1));
      alvo = ponto(destino);
      rolar(alvo, "assentar");
    };

    const aoRodar = (e: WheelEvent) => {
      if (e.ctrlKey) return; // zoom do navegador
      ultimoToque = false;
      ultimoGesto = performance.now();
      const fator = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? window.innerHeight : 1;
      const delta = e.deltaY * fator * RODA;
      if (delta === 0) return;
      const agora = performance.now();
      const novoGesto = agora - ultimoEvento > SILENCIO;
      const y = window.scrollY;
      const lenis = pegarLenis();
      const destinoLenis = lenis ? lenis.targetScroll : y;

      if (novoGesto) {
        medir(); // a posicao da secao muda se algo acima dela muda de altura
        if (!dentro(y)) {
          // Fora da secao: so intervem se este gesto for atravessar a entrada.
          const vaiEntrar =
            (delta > 0 && y < inicio && destinoLenis + delta > inicio) ||
            (delta < 0 && y > fim() && destinoLenis + delta < fim());
          if (!vaiEntrar) return;
          ancora = delta > 0 ? 0 : total - 1;
          passoDireto = false;
          minimo = maximo = ponto(ancora); // entrada: desacelera e para no projeto
          alvo = destinoLenis;
        } else {
          const pos = posicao(y);
          ancora = Math.round(pos);
          const naPonta = Math.abs(pos - ancora) < 0.02;
          const saindo = naPonta && ((delta > 0 && ancora === total - 1) || (delta < 0 && ancora === 0));
          if (saindo && !animando) return; // gesto novo na ponta: libera a pagina
          // Roda de mouse anda em "dentes" de ~70px, pouco para arrastar: um
          // dente ja dispara o passo inteiro ate o vizinho, sem ir e voltar.
          const rodaDeMouse =
            e.deltaMode !== 0 || (Math.abs(e.deltaY) >= 50 && Number.isInteger(e.deltaY));
          if (rodaDeMouse) {
            passoDireto = true;
            minimo = maximo = alvo = ponto(limitar(ancora + Math.sign(delta), 0, total - 1));
            rolar(alvo, "assentar");
          } else {
            passoDireto = false;
            minimo = ponto(Math.max(0, ancora - 1));
            maximo = ponto(Math.min(total - 1, ancora + 1));
            alvo = limitar(destinoLenis, minimo, maximo);
          }
        }
      } else if (minimo === 0 && maximo === 0) {
        return; // gesto em andamento que nao e nosso
      }

      e.preventDefault();
      e.stopImmediatePropagation(); // o Lenis nao rola a pagina junto
      ultimoEvento = agora;
      if (passoDireto) {
        // Resto do giro da roda: engole ate o gesto acabar, sem mexer no passo.
        window.clearTimeout(fimGesto);
        fimGesto = window.setTimeout(() => {
          passoDireto = false;
          minimo = maximo = 0;
        }, SILENCIO);
        return;
      }
      direcao = Math.sign(delta);
      alvo = limitar(alvo + delta, minimo, maximo);
      rolar(alvo, "arrastar");
      window.clearTimeout(fimGesto);
      fimGesto = window.setTimeout(() => {
        assentar();
        minimo = maximo = 0;
      }, SILENCIO);
    };

    // Toque: rolagem nativa. Cada arraste e um passo; entrando com embalo, prende.
    let toqueY = 0;
    let toqueUsado = false;
    const aoTocar = (e: TouchEvent) => {
      ultimoToque = true;
      ultimoGesto = performance.now();
      toqueY = e.touches[0].clientY;
      toqueUsado = false;
      medir();
    };
    const aoArrastar = (e: TouchEvent) => {
      ultimoGesto = performance.now();
      const dy = toqueY - e.touches[0].clientY;
      if (Math.abs(dy) < 8) return;
      const y = window.scrollY;
      if (!dentro(y)) return;
      const dir = Math.sign(dy);
      const i = Math.round(posicao(y));
      const saindo = (dir > 0 && i === total - 1) || (dir < 0 && i === 0);
      if (saindo && !animando && !toqueUsado) return;
      e.preventDefault();
      if (!toqueUsado && !animando) irPara(i + dir);
      toqueUsado = true;
    };

    const aoRolar = () => {
      const y = window.scrollY;
      if (ultimoToque && !animando && performance.now() - ultimoGesto < 1200) {
        // Embalo do toque atravessando a entrada: no iOS, mexer no scroll
        // durante a inercia nao a interrompe; tirar o overflow interrompe.
        const prender = (destino: number) => {
          const html = document.documentElement;
          html.style.overflow = "hidden";
          window.scrollTo(0, destino);
          window.setTimeout(() => (html.style.overflow = ""), 60);
        };
        if (ultimoY < inicio - 1 && y > inicio + 1) prender(inicio);
        else if (ultimoY > fim() + 1 && y < fim() - 1) prender(fim());
      }
      ultimoY = window.scrollY;
      pedirDesenho();
    };

    const aoTeclar = (e: KeyboardEvent) => {
      const alvoTecla = e.target as HTMLElement;
      if (alvoTecla.closest("input, textarea, select, [contenteditable]")) return;
      const descer = ["ArrowDown", "PageDown"].includes(e.key) || (e.key === " " && !e.shiftKey);
      const subir = ["ArrowUp", "PageUp"].includes(e.key) || (e.key === " " && e.shiftKey);
      if (!descer && !subir) return;
      medir();
      const y = window.scrollY;
      if (!dentro(y)) return;
      const dir = descer ? 1 : -1;
      const i = Math.round(posicao(y));
      if (((dir > 0 && i === total - 1) || (dir < 0 && i === 0)) && !animando) return;
      e.preventDefault();
      if (!animando) irPara(i + dir);
    };

    const aoRedimensionar = () => {
      medir();
      desenhar();
    };

    medir();
    desenhar();
    const observador = new ResizeObserver(aoRedimensionar);
    observador.observe(secao);
    observador.observe(trilho);
    observador.observe(document.body);
    window.addEventListener("resize", aoRedimensionar);
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("wheel", aoRodar, { passive: false, capture: true });
    window.addEventListener("touchstart", aoTocar, { passive: true });
    window.addEventListener("touchmove", aoArrastar, { passive: false });
    window.addEventListener("keydown", aoTeclar);

    return () => {
      observador.disconnect();
      cancelAnimationFrame(quadro);
      window.clearTimeout(fimAnimacao);
      window.clearTimeout(fimGesto);
      window.removeEventListener("resize", aoRedimensionar);
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("wheel", aoRodar, { capture: true });
      window.removeEventListener("touchstart", aoTocar);
      window.removeEventListener("touchmove", aoArrastar);
      window.removeEventListener("keydown", aoTeclar);
    };
  }, [total]);

  return (
    <div id={id} className="pt-14 lg:pt-30">
      {/* O titulo rola normal com a pagina; so a faixa dos projetos prende na tela. */}
      <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-8 lg:px-14">{cabecalho}</div>

      <section
        ref={secaoRef}
        aria-label="Projetos"
        className="relative mt-6 lg:mt-10"
        // Uma tela de altura para cada passo entre projetos.
        style={{ height: `calc(100svh + ${(total - 1) * 100}svh)` }}
      >
        {/* 68px = altura do menu fixo do topo */}
        <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden pt-[68px] pb-4">
          <div className="mx-auto flex w-full max-w-[1280px] px-5 sm:px-8 lg:px-14">
            <div ref={trilhoRef} className="flex w-full items-start gap-4 will-change-transform lg:gap-6">
              {cartoes.map((cartao, i) => (
                <div
                  key={i}
                  // Imagem 16:10 fixa; o cartao fica o mais largo que couber na ALTURA da tela
                  // (menu, legenda, bolinhas e respiros ocupam ~270px no celular e ~300px no computador).
                  // No celular (tela alta e estreita) a imagem e 4:5; do tablet para cima, 16:10.
                  className="flex w-[max(260px,min(86%,calc((100svh-270px)*0.8+44px)))] sm:w-[max(260px,min(86%,calc((100svh-270px)*1.6+44px)))] shrink-0 lg:w-[max(320px,min(72%,calc((100svh-300px)*1.6+64px)))]"
                >
                  <div className="flex w-full origin-center will-change-transform">{cartao}</div>
                </div>
              ))}
            </div>
          </div>

          <div
            ref={bolinhasRef}
            className="mx-auto mt-5 flex w-full max-w-[1280px] items-center gap-2 px-5 sm:px-8 lg:px-14"
          >
            {cartoes.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => irParaRef.current(i)}
                aria-label={`Projeto ${i + 1} de ${total}`}
                aria-current={i === indice}
                className="h-2 w-2 rounded-pill bg-acc"
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
