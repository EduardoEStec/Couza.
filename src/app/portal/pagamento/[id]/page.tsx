import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirSessao } from "@/lib/sessao";
import { faturaDoCliente } from "@/db/portal";
import { dadosDoPagador } from "@/db/pagamento";
import { obterBoleto, obterPix } from "@/lib/asaas";
import { TopbarCheckout } from "@/components/portal/topbar";
import { Checkout } from "./checkout";

export const metadata: Metadata = {
  title: "Pagamento — Portal do Cliente | couza",
};

/**
 * O checkout tem abas, entao a tela e componente de cliente. O portao, a
 * busca da fatura e as chamadas ao Asaas ficam AQUI, no servidor:
 * componente de cliente nao protege nada e nao pode ver a chave do Asaas.
 *
 * Os dois ids no filtro (sessao + URL) garantem que ninguem abra a fatura
 * de outra pessoa trocando o uuid no endereco.
 */
export default async function Pagamento(
  props: PageProps<"/portal/pagamento/[id]">,
) {
  const { id } = await props.params;
  // Quem chega pelo botao do e-mail de cobranca nao esta logado. Passar o
  // caminho faz o login devolver a pessoa para ESTA fatura, nao para a home.
  const sessao = await exigirSessao(`/portal/pagamento/${id}`);

  const fatura = await faturaDoCliente(sessao.clienteId, id);
  if (!fatura) notFound();

  if (fatura.statusExibido === "paga") {
    return (
      <Aviso titulo="Esta fatura já está paga.">
        <Link
          href={`/portal/faturas/${id}/recibo`}
          className="text-acc hover:text-acc-hover"
        >
          Ver o recibo
        </Link>
      </Aviso>
    );
  }
  if (fatura.statusExibido === "cancelada") {
    return <Aviso titulo="Esta cobrança foi cancelada." />;
  }

  const pagador = await dadosDoPagador(sessao.clienteId, id);

  if (!pagador?.asaasCobrancaId) {
    // Acontece quando a sincronizacao com o Asaas falhou no cadastro. Dizer
    // a verdade e melhor do que mostrar um checkout que nao vai funcionar.
    return (
      <Aviso titulo="Esta fatura ainda não está pronta para pagamento.">
        <p className="mt-2 text-sm text-n1">
          Me chame que eu resolvo em minutos — não tente pagar por fora.
        </p>
      </Aviso>
    );
  }

  /**
   * Pix e boleto sao buscados aqui, em paralelo. Cada um pode falhar sozinho
   * — sem chave Pix cadastrada na conta Asaas, por exemplo, o QR nao vem.
   * Uma aba indisponivel nao pode derrubar as outras duas.
   */
  const [pix, boleto] = await Promise.all([
    obterPix(pagador.asaasCobrancaId).catch(() => null),
    obterBoleto(pagador.asaasCobrancaId).catch(() => null),
  ]);

  return (
    <Checkout
      faturaId={id}
      descricao={fatura.descricao}
      valorCentavos={fatura.valorCentavos}
      vencimento={fatura.vencimento}
      atrasada={fatura.statusExibido === "atrasada"}
      pagador={{
        nome: pagador.nome,
        documento: pagador.documento,
        telefone: pagador.telefone,
      }}
      pix={pix}
      boleto={boleto}
    />
  );
}

function Aviso({
  titulo,
  children,
}: {
  titulo: string;
  children?: React.ReactNode;
}) {
  return (
    <>
      <TopbarCheckout>
        <Link href="/portal/faturas" className="text-sm text-n1 hover:text-ink">
          Voltar às faturas
        </Link>
      </TopbarCheckout>
      <main className="mx-auto w-full max-w-[560px] px-5 py-16 text-center sm:px-8">
        <p className="text-[17px] font-medium">{titulo}</p>
        <div className="mt-2">{children}</div>
      </main>
    </>
  );
}
