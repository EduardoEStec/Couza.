import type { Metadata } from "next";
import Link from "next/link";
import { Botao, Marca, SetaEsquerda } from "@/components/ui";

/**
 * 404 do site inteiro: URL que nao existe e todo `notFound()` (portal e
 * admin inclusive) caem aqui. Nao ha mockup dela em design/; usa so os
 * tokens aprovados. Tela limpa, sem nav nem rodape — escolha do Guilherme.
 *
 * RASCUNHO: o texto e meu, no tom descontraido que foi pedido (15/10/2026).
 */
export const metadata: Metadata = {
  title: "Página não encontrada — Couza",
};

export default function NaoEncontrada() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5 py-14 text-center sm:px-8">
      <Link href="/" aria-label="couza, página inicial">
        <Marca />
      </Link>

      <p className="mt-12 text-hero font-semibold tracking-[-0.05em]">
        404<span className="text-acc">.</span>
      </p>

      <h1 className="mt-4 max-w-[20ch] text-h3 font-medium tracking-[-0.03em]">
        Essa página foi pro deploy e não voltou.
      </h1>

      <p className="mt-4 max-w-[46ch] text-lead text-n1">
        Já procuramos no código, nos logs e atrás do servidor. Nada. Ou ela mudou
        de endereço, ou nunca existiu — o que é bem pior.
      </p>

      <p className="mt-3 text-sm text-n2">Na nossa máquina funcionava.</p>

      <Botao href="/" grande className="mt-10">
        <SetaEsquerda />
        Voltar para o início
      </Botao>
    </main>
  );
}
