import Link from "next/link";
import type { ReactNode } from "react";
import { Marca, SetaEsquerda } from "@/components/ui";

/**
 * Casca das telas de acesso. O painel escuro da esquerda so aparece a
 * partir de 900px e so onde for passado — no mockup aprovado ele existe
 * apenas no login.
 */
export function CascaAuth({
  voltar,
  painel,
  rodape,
  children,
}: {
  voltar: { texto: string; href: string };
  painel?: ReactNode;
  rodape?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className={`grid min-h-dvh ${painel ? "lg:grid-cols-[1.05fr_1fr]" : "grid-cols-1"}`}
    >
      {painel && (
        <aside className="hidden flex-col justify-between bg-dark p-14 text-white lg:flex">
          {painel}
        </aside>
      )}

      <main className="flex flex-col px-5 sm:px-8 lg:px-10">
        <div className="flex min-h-[68px] items-center justify-between gap-4">
          <Link href="/" aria-label="courte, página inicial">
            <Marca />
          </Link>
          <Link
            href={voltar.href}
            className="inline-flex items-center gap-2 text-sm text-n1 transition-colors duration-200 ease-out-soft hover:text-ink"
          >
            <SetaEsquerda />
            {voltar.texto}
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-6 lg:py-12">
          {children}
        </div>

        {rodape && (
          <div className="pb-6 text-center text-xs text-n2">{rodape}</div>
        )}
      </main>
    </div>
  );
}

/** Titulo grande das telas de acesso: "Portal do / Cliente." */
export function TituloAcesso({ linhas }: { linhas: string[] }) {
  return (
    <h1 className="max-w-[9ch] text-[clamp(40px,7.5vw,72px)] leading-[1.03] tracking-[-0.035em]">
      {linhas[0]}
      <br />
      <span className="text-acc">{linhas[1]}</span>
    </h1>
  );
}

/** Campo estatico: a tela existe antes do formulario funcionar. */
export function Campo({
  rotulo,
  children,
  aoLado,
  foco = false,
  dica,
}: {
  rotulo: string;
  children: ReactNode;
  aoLado?: ReactNode;
  foco?: boolean;
  dica?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-ink">{rotulo}</span>
        {aoLado}
      </div>
      <div
        className={`flex min-h-[52px] items-center gap-2 rounded-btn border px-3.5 text-base transition-[border-color,box-shadow] duration-200 ease-out-soft ${
          foco ? "border-acc shadow-[0_0_0_3px_var(--color-acc-soft)]" : "border-line"
        }`}
      >
        {children}
      </div>
      {dica && <p className="text-[13px] text-n2">{dica}</p>}
    </div>
  );
}
