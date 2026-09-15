"use client";

import { useSyncExternalStore } from "react";
import { Falta } from "@/components/ui";
import { verifiqueEmail as t } from "@/content/portal";

/**
 * Repete de volta o e-mail que a pessoa acabou de digitar.
 *
 * Lê da URL no navegador, e não no servidor, de propósito: ler
 * `searchParams` no componente de página tornaria a tela inteira dinâmica,
 * e aí o Cloudflare renderizaria o casco de autenticação a cada visita só
 * para ecoar um texto. Estática, a página nem chega a invocar o Worker —
 * é servida direto pelo binding de assets.
 *
 * `useSyncExternalStore` é a ferramenta certa para ler algo que vive FORA
 * do React — aqui, a barra de endereços. Ela já tem um valor separado para
 * o servidor (null, porque lá não existe URL de navegador), então a
 * hidratação bate sem efeito e sem estado intermediário.
 */

/** A URL não muda enquanto esta tela existe: nada para assinar. */
const nadaMuda = () => () => {};
const noNavegador = () => new URLSearchParams(window.location.search).get("e");
const noServidor = () => null;

export function EmailDigitado() {
  const email = useSyncExternalStore(nadaMuda, noNavegador, noServidor);

  if (!email) return <Falta o={t.apoio.email} />;
  return <strong className="font-medium text-ink">{email}</strong>;
}
