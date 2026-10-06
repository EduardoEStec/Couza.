import type { Metadata } from "next";
import Link from "next/link";
import { faturas as t } from "@/content/portal";
import { exigirSessao } from "@/lib/sessao";
import { faturasDoCliente, type FaturaDoCliente, type Filtro } from "@/db/portal";
import { emDataBr, emReais } from "@/lib/dinheiro";
import { TopbarPortal } from "@/components/portal/topbar";
import { Alerta, Baixar, Botao, Check, Pilula } from "@/components/ui";

export const metadata: Metadata = {
  title: "Faturas — Portal do Cliente | couza",
};

/**
 * A partir de quantos dias antes do vencimento o botao vira "Antecipar
 * pagamento" em vez de "Pagar".
 *
 * NUMERO MEU, nao do Guilherme: dentro de uma semana do vencimento, pagar e
 * so pagar — nao e antecipar nada. Se ele preferir outro corte, muda aqui.
 */
const DIAS_PARA_SER_ANTECIPACAO = 7;

const FILTROS: { chave: Filtro; texto: string }[] = [
  { chave: "todas", texto: "Todas" },
  { chave: "aberta", texto: "Em aberto" },
  { chave: "paga", texto: "Pagas" },
  { chave: "atrasada", texto: "Atrasadas" },
];

const VAZIO: Record<Filtro, string> = {
  todas: "Você ainda não tem nenhuma fatura.",
  aberta: "Nenhuma fatura em aberto.",
  paga: "Nenhuma fatura paga ainda.",
  atrasada: "Nenhuma fatura atrasada.",
};

const FORMA = { cartao: "cartão", pix: "Pix", boleto: "boleto" };

export default async function Faturas(props: PageProps<"/portal/faturas">) {
  const sessao = await exigirSessao();
  const { f } = await props.searchParams;
  const filtro: Filtro = FILTROS.some((x) => x.chave === f)
    ? (f as Filtro)
    : "todas";

  const lista = await faturasDoCliente(sessao.clienteId, filtro);

  return (
    <>
      <TopbarPortal ativo="/portal/faturas" />

      <main className="mx-auto w-full max-w-[1280px] px-5 pb-12 sm:px-8 lg:px-14 lg:pb-18">
        <div className="pt-7 pb-5 lg:pt-12 lg:pb-7">
          <h1 className="text-[clamp(30px,3.2vw,46px)]">{t.titulo}</h1>
          <p className="mt-3.5 text-[17px] text-n1">{t.apoio}</p>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {FILTROS.map((x) => (
            <Link
              key={x.chave}
              href={
                x.chave === "todas"
                  ? "/portal/faturas"
                  : `/portal/faturas?f=${x.chave}`
              }
              aria-current={filtro === x.chave ? "page" : undefined}
              className={`inline-flex h-11 items-center rounded-pill px-4 text-[15px] font-medium transition-colors duration-200 ease-out-soft ${
                filtro === x.chave
                  ? "bg-dark text-white"
                  : "bg-wash text-n1 hover:text-ink"
              }`}
            >
              {x.texto}
            </Link>
          ))}
        </div>

        {lista.length === 0 ? (
          <div className="rounded-card border border-dashed border-line px-6 py-14 text-center">
            <p className="text-[17px] font-medium">{VAZIO[filtro]}</p>
            {filtro === "atrasada" && (
              <p className="mt-2 text-sm text-n1">Está tudo em dia.</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {lista.map((fatura) => (
              <CardFatura key={fatura.id} fatura={fatura} />
            ))}
          </div>
        )}

        {lista.length > 0 && (
          <p className="mt-5.5 text-center text-xs leading-relaxed text-n2">
            {t.rodape}
          </p>
        )}
      </main>
    </>
  );
}

function CardFatura({ fatura: f }: { fatura: FaturaDoCliente }) {
  const atrasada = f.statusExibido === "atrasada";
  const paga = f.statusExibido === "paga";
  const cancelada = f.statusExibido === "cancelada";
  const antecipando =
    f.statusExibido === "aberta" && f.diasAteVencer > DIAS_PARA_SER_ANTECIPACAO;

  const casca = atrasada
    ? "bg-danger-wash border-[#F7D2CE]"
    : paga || cancelada
      ? "bg-wash border-transparent"
      : "bg-white border-line";

  const meta = atrasada ? "text-[#8A5A54]" : "text-n1";
  const atraso = Math.abs(f.diasAteVencer);

  return (
    <article className={`rounded-card border p-[22px] lg:p-8 ${casca}`}>
      <div className="flex flex-col gap-4.5 md:flex-row md:items-center md:justify-between md:gap-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            {atrasada && (
              <>
                <Pilula tom="perigo" className="bg-white">
                  <Alerta />
                  Atrasada
                </Pilula>
                <span className="text-sm text-danger">
                  Venceu há {atraso} dia{atraso === 1 ? "" : "s"}
                </span>
              </>
            )}
            {f.statusExibido === "aberta" && (
              <>
                <Pilula tom="acc" ponto>
                  Em aberto
                </Pilula>
                <span className="text-sm text-n1">
                  {f.diasAteVencer === 0
                    ? "Vence hoje"
                    : `Vence em ${f.diasAteVencer} dia${f.diasAteVencer === 1 ? "" : "s"}`}
                </span>
              </>
            )}
            {paga && (
              <>
                <Pilula tom="neutra" className="bg-white">
                  <Check tamanho={13} />
                  Paga
                </Pilula>
                {f.formaPagamento && (
                  <span className="text-sm text-n1">
                    Pagamento por {FORMA[f.formaPagamento]}
                  </span>
                )}
              </>
            )}
            {cancelada && (
              <Pilula tom="neutra" className="bg-white">
                Cancelada
              </Pilula>
            )}
          </div>

          <p
            className={`mt-3.5 text-[clamp(26px,2.2vw,32px)] leading-[1.1] font-medium tracking-[-0.03em] ${
              paga || cancelada ? "text-n1" : ""
            }`}
          >
            R$ {emReais(f.valorCentavos)}
          </p>

          <p className={`mt-2.5 text-sm ${meta}`}>
            Fatura {f.numero} · {f.descricao}
          </p>
          <p className={`mt-1 text-sm ${meta}`}>
            {paga
              ? `Paga em ${emDataBr(f.pagoEm)}`
              : `Vencimento ${emDataBr(f.vencimento)}`}
            {f.produtoNome && ` · ${f.produtoNome}`}
          </p>
        </div>

        <div className="shrink-0">
          {atrasada && (
            <Botao
              href={`/portal/pagamento/${f.id}`}
              className="border-danger bg-danger hover:border-[#B5251A] hover:bg-[#B5251A]"
            >
              Pagar agora
            </Botao>
          )}
          {f.statusExibido === "aberta" && (
            <Botao
              href={`/portal/pagamento/${f.id}`}
              variante={antecipando ? "contorno" : "primario"}
            >
              {antecipando ? "Antecipar pagamento" : "Pagar"}
            </Botao>
          )}
          {paga && (
            <Botao
              href={`/portal/faturas/${f.id}/recibo`}
              variante="contorno"
              className="bg-white"
            >
              <Baixar />
              Recibo
            </Botao>
          )}
        </div>
      </div>
    </article>
  );
}
