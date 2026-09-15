"use client";

import { Botao, Imprimir } from "@/components/ui";

/** Unico pedaco de cliente da tela de recibo: chamar a impressao. */
export function BotaoImprimir({ texto }: { texto: string }) {
  return (
    <Botao grande bloco onClick={() => window.print()}>
      <Imprimir />
      {texto}
    </Botao>
  );
}
