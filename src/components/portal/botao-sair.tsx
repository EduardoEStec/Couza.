"use client";

import { useTransition } from "react";
import { sairDoPortal } from "@/app/portal/login/acoes";

/**
 * O mockup aprovado mostra so o avatar no topo, sem sair. Botao de sair e
 * obrigatorio num portal com fatura — principalmente em computador
 * compartilhado. Este e o minimo: texto discreto ao lado do avatar, com os
 * tokens aprovados. Trocar quando o Guilherme desenhar o menu do avatar.
 */
export function BotaoSair() {
  const [saindo, iniciar] = useTransition();

  return (
    <button
      type="button"
      onClick={() => iniciar(() => void sairDoPortal())}
      disabled={saindo}
      className="text-sm text-n1 transition-colors duration-200 ease-out-soft hover:text-ink disabled:opacity-60"
    >
      {saindo ? "Saindo…" : "Sair"}
    </button>
  );
}
