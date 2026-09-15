"use client";

import { useActionState } from "react";
import { primeiroAcesso as t } from "@/content/portal";
import { Botao, Envelope } from "@/components/ui";
import { pedirLinkAcesso, type EstadoForm } from "./acoes";

export function FormularioPrimeiroAcesso() {
  const [estado, acao, enviando] = useActionState<EstadoForm, FormData>(
    pedirLinkAcesso,
    {},
  );

  return (
    <form action={acao} className="mt-8 flex flex-col gap-4.5">
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium text-ink">
          {t.campo}
        </label>
        <div
          className={`flex min-h-[52px] items-center gap-2 rounded-btn border px-3.5 transition-[border-color,box-shadow] duration-200 ease-out-soft focus-within:border-acc focus-within:shadow-[0_0_0_3px_var(--color-acc-soft)] ${
            estado.erro ? "border-danger" : "border-line"
          }`}
        >
          <Envelope tamanho={19} className="shrink-0 text-n1" />
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
        {estado.erro ? (
          <p className="text-[13px] text-danger">{estado.erro}</p>
        ) : (
          <p className="text-[13px] text-n2">{t.dica}</p>
        )}
      </div>

      <Botao grande bloco type="submit" disabled={enviando} className="mt-1.5">
        {enviando ? "Enviando…" : t.enviar}
      </Botao>
    </form>
  );
}
