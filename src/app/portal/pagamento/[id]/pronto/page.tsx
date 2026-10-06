import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirSessao } from "@/lib/sessao";
import { faturaDoCliente } from "@/db/portal";
import { emDataBr, emReais } from "@/lib/dinheiro";
import { TopbarCheckout } from "@/components/portal/topbar";
import { Botao, Check } from "@/components/ui";

export const metadata: Metadata = {
  title: "Pagamento confirmado — Portal do Cliente | couza",
};

/** Tela de confirmação depois do pagamento — pedida no ETAPAS.md. */
export default async function Pronto(
  props: PageProps<"/portal/pagamento/[id]/pronto">,
) {
  const sessao = await exigirSessao();
  const { id } = await props.params;

  const fatura = await faturaDoCliente(sessao.clienteId, id);
  if (!fatura) notFound();

  return (
    <>
      <TopbarCheckout>
        <Link href="/portal/faturas" className="text-sm text-n1 hover:text-ink">
          Faturas
        </Link>
      </TopbarCheckout>

      <main className="mx-auto w-full max-w-[560px] px-5 py-14 sm:px-8">
        <span className="flex h-16 w-16 items-center justify-center rounded-pill bg-acc-soft">
          <Check tamanho={30} className="text-acc" />
        </span>

        <h1 className="mt-6 text-[clamp(30px,3.2vw,42px)] leading-[1.05] tracking-[-0.035em]">
          Pagamento
          <br />
          <span className="text-acc">confirmado.</span>
        </h1>

        <p className="mt-4 text-lead text-n1">
          Recebi o pagamento de R$ {emReais(fatura.valorCentavos)} da fatura{" "}
          {fatura.numero}. Não precisa mandar comprovante.
        </p>

        <dl className="mt-7 rounded-card border border-line p-[22px]">
          <Linha rotulo="Fatura" valor={String(fatura.numero)} />
          <Linha rotulo="Descrição" valor={fatura.descricao} />
          <Linha rotulo="Valor" valor={`R$ ${emReais(fatura.valorCentavos)}`} />
          {fatura.pagoEm && (
            <Linha rotulo="Pago em" valor={emDataBr(fatura.pagoEm)} />
          )}
        </dl>

        <div className="mt-7 flex flex-col gap-3">
          {fatura.statusExibido === "paga" && (
            <Botao grande bloco href={`/portal/faturas/${id}/recibo`}>
              Ver o recibo
            </Botao>
          )}
          <Botao grande bloco variante="contorno" href="/portal/faturas">
            Voltar às faturas
          </Botao>
        </div>
      </main>
    </>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-line py-3.5 first:border-t-0">
      <dt className="text-[15px] text-n1">{rotulo}</dt>
      <dd className="m-0 text-right text-[15px] font-medium">{valor}</dd>
    </div>
  );
}
