import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { exigirSessao } from "@/lib/sessao";
import { faturaDoCliente } from "@/db/portal";
import { Checkout } from "./checkout";

export const metadata: Metadata = {
  title: "Pagamento — Portal do Cliente | courte",
};

/**
 * O checkout tem abas, entao e componente de cliente. O portao e a busca da
 * fatura ficam AQUI, no servidor: componente de cliente nao protege nada.
 *
 * Os dois ids no filtro (sessao + URL) garantem que ninguem abra a fatura
 * de outra pessoa trocando o uuid no endereco.
 *
 * As formas de pagamento ainda sao marcador: cartao, Pix e boleto de
 * verdade sao a etapa 6. O resumo do topo ja e real.
 */
export default async function Pagamento(
  props: PageProps<"/portal/pagamento/[id]">,
) {
  const sessao = await exigirSessao();
  const { id } = await props.params;

  const fatura = await faturaDoCliente(sessao.clienteId, id);
  if (!fatura) notFound();

  return (
    <Checkout
      descricao={fatura.descricao}
      valorCentavos={fatura.valorCentavos}
      vencimento={fatura.vencimento}
      jaPaga={fatura.statusExibido === "paga"}
      faturaId={fatura.id}
    />
  );
}
