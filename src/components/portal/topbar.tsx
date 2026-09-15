import Link from "next/link";
import { navPortal } from "@/content/portal";
import { Caixa, Marca, Nota, Usuario } from "@/components/ui";
import { BotaoSair } from "./botao-sair";

const icones = { caixa: Caixa, nota: Nota };

/**
 * Topo do portal. Em telas largas os links ficam no proprio topo; no
 * celular eles viram a fileira de pilulas logo abaixo, como no mockup.
 */
export function TopbarPortal({ ativo }: { ativo: "/portal" | "/portal/faturas" }) {
  return (
    <>
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-white/94 px-5 py-3.5 backdrop-blur-[8px] sm:px-8 lg:px-14">
        <Link href="/portal" aria-label="Portal do Cliente">
          <Marca />
        </Link>

        <nav className="hidden gap-6.5 lg:flex">
          {navPortal.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={ativo === l.href ? "page" : undefined}
              className={
                ativo === l.href
                  ? "font-medium text-ink"
                  : "text-n1 transition-colors duration-200 ease-out-soft hover:text-ink"
              }
            >
              {l.texto}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <BotaoSair />
          <span className="flex h-10 w-10 items-center justify-center rounded-pill bg-wash text-n1">
            <Usuario />
          </span>
        </div>
      </header>

      <div className="px-5 pt-4 sm:px-8 lg:hidden">
        <div className="flex gap-2 overflow-hidden">
          {navPortal.map((l) => {
            const Icone = icones[l.icone];
            const selecionado = ativo === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={selecionado ? "page" : undefined}
                className={`inline-flex h-11 items-center gap-2 rounded-pill px-4 text-[15px] font-medium whitespace-nowrap ${
                  selecionado ? "bg-dark text-white" : "bg-wash text-n1"
                }`}
              >
                <Icone />
                {l.texto}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}

/** Topo enxuto do checkout: sem navegacao, so marca, selo e sair. */
export function TopbarCheckout({ children }: { children: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-white/94 px-5 py-3.5 backdrop-blur-[8px] sm:px-8">
      <Marca />
      {children}
    </header>
  );
}
