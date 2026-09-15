"use client";

import { useState } from "react";
import { duvidas } from "@/content/site";
import { Falta, Sobretitulo } from "@/components/ui";
import { Revelar } from "@/components/movimento";

/**
 * Acordeao do quadro "Movimento": altura 0fr -> 1fr em 320ms com --ease-inout-soft,
 * e a barra vertical do "+" encolhe em scaleY ate virar "-". Sem salto de layout.
 */
export function Duvidas() {
  const [aberta, setAberta] = useState<number | null>(0);

  return (
    <section
      id="duvidas"
      className="mx-auto w-full max-w-[1280px] px-5 py-14 sm:px-8 lg:px-14 lg:py-30"
    >
      <div className="grid items-start gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div>
          <Sobretitulo>{duvidas.sobretitulo}</Sobretitulo>
          <h2 className="mt-4 max-w-[12ch] text-h2">
            <Revelar>{duvidas.titulo}</Revelar>
          </h2>
        </div>

        <div className="lg:mt-2">
          {duvidas.itens.map((item, i) => {
            const estaAberta = aberta === i;
            return (
              <div key={item.pergunta} className="border-t border-line first:border-t-0">
                <button
                  type="button"
                  onClick={() => setAberta(estaAberta ? null : i)}
                  aria-expanded={estaAberta}
                  className="flex w-full items-start justify-between gap-4 py-5.5 text-left"
                >
                  <span className="flex-1 text-[18px] font-medium leading-[1.3] tracking-[-0.02em] lg:text-[22px]">
                    {item.pergunta}
                  </span>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    aria-hidden
                    className={`mt-1 shrink-0 transition-colors duration-200 ease-out-soft ${
                      estaAberta ? "text-ink" : "text-n1"
                    }`}
                  >
                    <path d="M5 12h14" />
                    <path
                      d="M12 5v14"
                      className="origin-center transition-transform duration-[320ms] ease-inout-soft"
                      style={{ transform: estaAberta ? "scaleY(0)" : "scaleY(1)" }}
                    />
                  </svg>
                </button>

                <div
                  className="grid transition-[grid-template-rows] duration-[320ms] ease-inout-soft"
                  style={{ gridTemplateRows: estaAberta ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <p className="pb-5.5 text-sm leading-[1.6] text-n1">
                      {item.resposta.map((pedaco, j) =>
                        typeof pedaco === "string" ? (
                          pedaco
                        ) : (
                          <Falta key={j} o={pedaco} />
                        ),
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
