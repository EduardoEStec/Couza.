"use client";

import { useActionState } from "react";
import { criarSenha as t } from "@/content/portal";
import { Botao } from "@/components/ui";
import { criarSenhaComToken, type EstadoForm } from "./acoes";

export function FormularioCriarSenha({ token }: { token: string }) {
  const [estado, acao, enviando] = useActionState<EstadoForm, FormData>(
    criarSenhaComToken,
    {},
  );

  return (
    <form action={acao} className="mt-8 flex flex-col gap-4.5">
      <input type="hidden" name="token" value={token} />

      <CampoSenha
        id="senha"
        rotulo={t.campos.senha}
        dica={t.regra}
        autoComplete="new-password"
        erro={!!estado.erro}
        disabled={enviando}
      />
      <CampoSenha
        id="confirmar"
        rotulo={t.campos.confirmar}
        autoComplete="new-password"
        erro={!!estado.erro}
        disabled={enviando}
      />

      {estado.erro && <p className="text-[13px] text-danger">{estado.erro}</p>}

      <Botao grande bloco type="submit" disabled={enviando} className="mt-1.5">
        {enviando ? "Criando…" : t.enviar}
      </Botao>
    </form>
  );
}

function CampoSenha({
  id,
  rotulo,
  dica,
  autoComplete,
  erro,
  disabled,
}: {
  id: string;
  rotulo: string;
  dica?: string;
  autoComplete: string;
  erro: boolean;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {rotulo}
      </label>
      <div
        className={`flex min-h-[52px] items-center gap-2 rounded-btn border px-3.5 transition-[border-color,box-shadow] duration-200 ease-out-soft focus-within:border-acc focus-within:shadow-[0_0_0_3px_var(--color-acc-soft)] ${
          erro ? "border-danger" : "border-line"
        }`}
      >
        <input
          id={id}
          name={id}
          type="password"
          required
          minLength={8}
          autoComplete={autoComplete}
          disabled={disabled}
          className="w-full bg-transparent text-base text-ink outline-none"
        />
      </div>
      {dica && <p className="text-[13px] text-n2">{dica}</p>}
    </div>
  );
}
