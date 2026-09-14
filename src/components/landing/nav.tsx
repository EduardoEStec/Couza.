"use client";

import Link from "next/link";
import { useState } from "react";
import { nav } from "@/content/site";
import { Botao, Marca, Menu } from "@/components/ui";

export function Nav() {
  const [aberto, setAberto] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/94 backdrop-blur-[8px]">
      <div className="mx-auto flex min-h-[68px] w-full max-w-[1280px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-14">
        <Link href="/" aria-label="courte, página inicial">
          <Marca />
        </Link>

        <nav className="hidden gap-7 lg:flex">
          {nav.links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="risco text-base text-n1 transition-colors duration-200 ease-out-soft hover:text-ink"
            >
              {l.texto}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <Botao href={nav.portal.href} className="min-h-11 px-[18px] text-[15px]">
            {nav.portal.texto}
          </Botao>

          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            aria-expanded={aberto}
            aria-controls="menu-mobile"
            aria-label={aberto ? "Fechar menu" : "Abrir menu"}
            className="flex h-11 w-11 items-center justify-center rounded-btn border border-line text-ink transition-colors duration-200 ease-out-soft hover:bg-wash lg:hidden"
          >
            <Menu />
          </button>
        </div>
      </div>

      {/* O mockup aprovado mostra o icone de menu, mas nao desenhou o painel.
          Este painel e o minimo para o botao nao ficar morto — reusa os tokens
          aprovados e nada mais. Trocar quando o Guilherme desenhar o dele. */}
      <div
        id="menu-mobile"
        hidden={!aberto}
        className="border-t border-line bg-white lg:hidden"
      >
        <nav className="mx-auto flex w-full max-w-[1280px] flex-col px-5 py-2 sm:px-8">
          {nav.links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setAberto(false)}
              className="border-b border-line py-4 text-[17px] text-ink last:border-b-0"
            >
              {l.texto}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
