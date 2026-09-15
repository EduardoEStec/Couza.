"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login as t } from "@/content/portal";
import { Botao } from "@/components/ui";
import { entrarNoPortal, type EstadoForm } from "./acoes";

export function FormularioLogin() {
  const [estado, acao, enviando] = useActionState<EstadoForm, FormData>(
    entrarNoPortal,
    {},
  );

  const borda = estado.erro ? "border-danger" : "border-line";

  return (
    <form action={acao} className="mt-8 flex flex-col gap-4.5">
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium text-ink">
          {t.campos.email}
        </label>
        <div
          className={`flex min-h-[52px] items-center rounded-btn border px-3.5 transition-[border-color,box-shadow] duration-200 ease-out-soft focus-within:border-acc focus-within:shadow-[0_0_0_3px_var(--color-acc-soft)] ${borda}`}
        >
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="seu@email.com"
            disabled={enviando}
            className="w-full bg-transparent text-base text-ink outline-none placeholder:text-n2"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="senha" className="text-sm font-medium text-ink">
            {t.campos.senha}
          </label>
          <Link
            href="/portal/esqueci-senha"
            className="text-sm text-acc transition-colors duration-200 ease-out-soft hover:text-acc-hover"
          >
            {t.esqueci}
          </Link>
        </div>
        <div
          className={`flex min-h-[52px] items-center rounded-btn border px-3.5 transition-[border-color,box-shadow] duration-200 ease-out-soft focus-within:border-acc focus-within:shadow-[0_0_0_3px_var(--color-acc-soft)] ${borda}`}
        >
          <input
            id="senha"
            name="senha"
            type="password"
            required
            autoComplete="current-password"
            disabled={enviando}
            className="w-full bg-transparent text-base text-ink outline-none"
          />
        </div>
      </div>

      {estado.erro && (
        <p role="alert" className="text-[13px] leading-relaxed text-danger">
          {estado.erro}
        </p>
      )}

      <Botao grande bloco type="submit" disabled={enviando} className="mt-1.5">
        {enviando ? "Entrando…" : t.entrar}
      </Botao>
    </form>
  );
}
