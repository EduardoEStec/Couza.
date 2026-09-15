import type { Metadata } from "next";
import { exigirSessao } from "@/lib/sessao";
import { Checkout } from "./checkout";

export const metadata: Metadata = {
  title: "Pagamento — Portal do Cliente | courte",
};

/**
 * A tela de pagamento tem abas, entao e componente de cliente. O portao
 * mora aqui, no servidor: cliente nao protege nada.
 */
export default async function Pagamento() {
  await exigirSessao();
  return <Checkout />;
}
