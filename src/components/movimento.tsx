"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { motion } from "motion/react";

/** Curva --ease-out-soft do quadro "Movimento", em forma de array para o Motion. */
const EASE_OUT_SOFT = [0.22, 0.61, 0.36, 1] as const;

/**
 * Scroll suave — configuracao aprovada no quadro "Movimento".
 *
 * Nota: o mockup dizia `smoothTouch: false`. Essa opcao nao existe mais no
 * Lenis 1.3 (virou `syncTouch`), e o padrao ja e o scroll nativo no toque —
 * que era exatamente a intencao. Por isso nao passamos nada de touch aqui.
 */
export function ScrollSuave() {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      wheelMultiplier: 0.7,
      gestureOrientation: "vertical",
    });
    let frame = requestAnimationFrame(function passo(tempo: number) {
      lenis.raf(tempo);
      frame = requestAnimationFrame(passo);
    });

    // Links para um trecho da propria pagina ("#contato", "/#servicos"): o Link
    // do Next so rola na PRIMEIRA vez — se a URL ja termina em #contato, o
    // segundo clique nao faz nada. Aqui o clique e tratado sempre, com o
    // scroll suave, e a URL so ganha o # (sem nova entrada no historico).
    const aoClicar = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank") return;
      const url = new URL(link.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
      const alvo = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!alvo) return;
      // Sem stopPropagation: o onClick do proprio link (ex.: fechar o menu do
      // celular) ainda roda, e o Link do Next ve defaultPrevented e nao navega.
      e.preventDefault();
      history.replaceState(history.state, "", url.hash);
      // Espera o quadro seguinte: o clique pode fechar o menu do celular, que
      // muda a altura do topo e, com ela, a posicao do destino.
      requestAnimationFrame(() => requestAnimationFrame(() => lenis.scrollTo(alvo)));
    };
    window.addEventListener("click", aoClicar, { capture: true });

    return () => {
      window.removeEventListener("click", aoClicar, { capture: true });
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return null;
}

/**
 * Entrada de titulo — quadro "Movimento":
 * por palavra, sobe 0.45em + opacidade, 600ms, 60ms de atraso entre palavras,
 * dispara uma vez quando o bloco entra na tela (sem prender ao scroll).
 */
export function Revelar({
  children,
  className,
  atraso = 0,
}: {
  children: string;
  className?: string;
  atraso?: number;
}) {
  const palavras = children.split(" ");

  return (
    <span className={className}>
      {palavras.map((palavra, i) => (
        <motion.span
          key={`${palavra}-${i}`}
          className="inline-block"
          initial={{ opacity: 0, y: "0.45em" }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -15% 0px" }}
          transition={{
            duration: 0.6,
            ease: EASE_OUT_SOFT,
            delay: atraso + i * 0.06,
          }}
        >
          {palavra}
          {i < palavras.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </span>
  );
}

/** Entrada de bloco inteiro — mesmo tempo e curva, sem quebrar em palavras. */
export function Entrar({
  children,
  className,
  atraso = 0,
}: {
  children: React.ReactNode;
  className?: string;
  atraso?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -15% 0px" }}
      transition={{ duration: 0.6, ease: EASE_OUT_SOFT, delay: atraso }}
    >
      {children}
    </motion.div>
  );
}
