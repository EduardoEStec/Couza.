import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { recibo as t } from "@/content/portal";
import { marca } from "@/content/site";
import { exigirSessao } from "@/lib/sessao";
import { dadosParaRecibo, faturaDoCliente } from "@/db/portal";
import { emDataBr, emReais } from "@/lib/dinheiro";
import { TopbarPortal } from "@/components/portal/topbar";
import { BotaoImprimir } from "@/components/portal/botao-imprimir";
import { Falta, Info, Marca, SetaEsquerda } from "@/components/ui";

export const metadata: Metadata = {
  title: "Recibo — Portal do Cliente | courte",
};

const d = t.documento;
const FORMA = { cartao: "Cartão", pix: "Pix", boleto: "Boleto" };

export default async function Recibo(
  props: PageProps<"/portal/faturas/[id]/recibo">,
) {
  const sessao = await exigirSessao();
  const { id } = await props.params;

  // Os dois ids no filtro: a fatura tem que ser DESTE cliente.
  const fatura = await faturaDoCliente(sessao.clienteId, id);
  if (!fatura) notFound();

  // Recibo e comprovante de pagamento: sem pagamento, nao ha o que comprovar.
  if (fatura.statusExibido !== "paga") {
    return (
      <>
        <TopbarPortal ativo="/portal/faturas" />
        <main className="mx-auto w-full max-w-[1280px] px-5 py-12 sm:px-8 lg:px-14">
          <Voltar />
          <div className="mt-6 max-w-[560px] rounded-card border border-dashed border-line px-6 py-12 text-center">
            <p className="text-[17px] font-medium">Esta fatura ainda não foi paga.</p>
            <p className="mt-2 text-sm text-n1">
              O recibo aparece aqui assim que o pagamento for confirmado.
            </p>
          </div>
        </main>
      </>
    );
  }

  const cliente = await dadosParaRecibo(sessao.clienteId);

  return (
    <>
      <div className="nao-imprimir">
        <TopbarPortal ativo="/portal/faturas" />
      </div>

      <main className="mx-auto w-full max-w-[1280px] px-5 pb-12 sm:px-8 lg:px-14 lg:pb-18">
        <div className="nao-imprimir">
          <div className="pt-5">
            <Voltar />
          </div>

          <div className="pt-5 pb-5 lg:pb-7">
            <h1 className="text-[clamp(30px,3.2vw,46px)]">{t.titulo}</h1>
            <p className="mt-3.5 text-[17px] text-n1">
              Fatura {fatura.numero}, paga em {emDataBr(fatura.pagoEm)}.
            </p>
          </div>

          <div className="max-w-[560px]">
            <BotaoImprimir texto={t.imprimir} />
            <div className="mt-3.5 flex items-start gap-2.5 rounded-btn bg-wash px-4 py-3.5">
              <Info className="mt-0.5 shrink-0 text-n1" />
              <p className="text-xs leading-snug text-n1">
                {t.dica.antes}
                <strong className="font-medium text-ink">{t.dica.forte}</strong>
                {t.dica.depois}
              </p>
            </div>
          </div>

          <p className="mt-7 mb-3 text-xs uppercase tracking-[0.14em] text-n1">
            {t.previa}
          </p>
        </div>

        {/* A folha. No papel perde borda, arredondado e margem. */}
        <div className="folha max-w-[794px] rounded-[20px] border border-line bg-white p-[22px] lg:p-12">
          <div className="flex items-start justify-between gap-6 border-b-2 border-ink pb-3.5">
            <Marca />
            <span className="text-[20px] font-semibold uppercase tracking-[0.14em] lg:text-[28px]">
              {t.titulo}
            </span>
          </div>

          <div className="mt-3.5 text-sm text-n1 lg:text-right">
            {marca.pessoa} · CPF <Falta o={marca.cpf} /> · <Falta o={marca.cidade} />
          </div>

          <div className="mt-6 bg-wash p-5 lg:p-7">
            <p className="text-xs uppercase tracking-[0.16em] text-n1">
              {d.rotuloValor}
            </p>
            <p className="mt-2 text-[clamp(32px,4vw,42px)] leading-[1.05] font-medium tracking-[-0.035em]">
              R$ {emReais(fatura.valorCentavos)}
            </p>
            <p className="mt-2 text-base text-n1">
              <Falta o={d.extenso} />
            </p>
          </div>

          <p className="mt-6 text-[17px] leading-[1.85]">
            {d.corpo.a}
            <strong className="font-medium">{cliente.nome}</strong>
            {cliente.documento ? (
              <>
                {d.corpo.b}
                {cliente.documento}
              </>
            ) : null}
            {d.corpo.c}
            <strong className="font-medium">{fatura.descricao}</strong>
            {d.corpo.d}
          </p>

          <dl className="mt-6">
            <LinhaDoc rotulo="Fatura" valor={String(fatura.numero)} />
            {fatura.produtoNome && (
              <LinhaDoc rotulo="Produto" valor={fatura.produtoNome} />
            )}
            <LinhaDoc
              rotulo="Forma de pagamento"
              valor={fatura.formaPagamento ? FORMA[fatura.formaPagamento] : "—"}
            />
            <LinhaDoc rotulo="Data do pagamento" valor={emDataBr(fatura.pagoEm)} />
          </dl>

          <div className="mt-10">
            <p className="text-base">
              <Falta o={d.local.cidade} />, {emDataBr(fatura.pagoEm)}.
            </p>
            <div className="mt-12 w-full max-w-[320px] border-t border-ink pt-2.5">
              <p className="text-base font-medium">{marca.pessoa}</p>
              <p className="text-sm text-n1">
                CPF <Falta o={marca.cpf} />
              </p>
            </div>
          </div>

          <p className="mt-9 border-t border-line pt-4 text-[13px] leading-relaxed text-n1">
            {d.aviso}
          </p>
        </div>
      </main>
    </>
  );
}

function Voltar() {
  return (
    <Link
      href="/portal/faturas"
      className="inline-flex items-center gap-2 text-sm text-n1 transition-colors duration-200 ease-out-soft hover:text-ink"
    >
      <SetaEsquerda />
      {t.voltar}
    </Link>
  );
}

function LinhaDoc({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-center justify-between gap-6 border-t border-line py-3.5 first:border-t-0">
      <dt className="text-base text-n1">{rotulo}</dt>
      <dd className="m-0 text-right text-base font-medium">{valor}</dd>
    </div>
  );
}
