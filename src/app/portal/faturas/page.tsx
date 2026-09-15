import type { Metadata } from "next";
import { faturas as t, type Fatura } from "@/content/portal";
import { TopbarPortal } from "@/components/portal/topbar";
import { Alerta, Baixar, Botao, Check, Falta, Pilula } from "@/components/ui";

export const metadata: Metadata = {
  title: "Faturas — Portal do Cliente | courte",
};

/** Cada estado tem sua casca. As cores saem do quadro "Tokens". */
const estilos = {
  atrasada: {
    cartao: "bg-danger-wash border-[#F7D2CE]",
    valor: "",
    meta: "text-[#8A5A54]",
    caixinha: "bg-white",
  },
  aberta: {
    cartao: "bg-white border-line",
    valor: "",
    meta: "text-n1",
    caixinha: "",
  },
  paga: {
    cartao: "bg-wash border-transparent",
    valor: "text-n1",
    meta: "text-n1",
    caixinha: "bg-white",
  },
} as const;

function Selo({ fatura }: { fatura: Fatura }) {
  if (fatura.estado === "atrasada") {
    return (
      <>
        <Pilula tom="perigo" className="bg-white">
          <Alerta />
          Atrasada
        </Pilula>
        <span className="text-sm text-danger">
          Venceu há <Falta o={fatura.dias} /> dias
        </span>
      </>
    );
  }
  if (fatura.estado === "aberta") {
    return (
      <>
        <Pilula tom="acc" ponto>
          Em aberto
        </Pilula>
        <span className="text-sm text-n1">
          Vence em <Falta o={fatura.dias} /> dias
        </span>
      </>
    );
  }
  return (
    <>
      <Pilula tom="neutra" className="bg-white">
        <Check tamanho={13} />
        Paga
      </Pilula>
      {fatura.formaPagamento && (
        <span className="text-sm text-n1">
          Pagamento por <Falta o={fatura.formaPagamento} />
        </span>
      )}
    </>
  );
}

export default function Faturas() {
  return (
    <>
      <TopbarPortal ativo="/portal/faturas" />

      <main className="mx-auto w-full max-w-[1280px] px-5 pb-12 sm:px-8 lg:px-14 lg:pb-18">
        <div className="pt-7 pb-5 lg:pt-12 lg:pb-7">
          <h1 className="text-[clamp(30px,3.2vw,46px)]">{t.titulo}</h1>
          <p className="mt-3.5 text-[17px] text-n1">{t.apoio}</p>
        </div>

        {/* Filtros ainda sem comportamento: o primeiro fica marcado ate a
            fase em que a lista vem do banco. */}
        <div className="mb-5 flex flex-wrap gap-2">
          {t.filtros.map((filtro, i) => (
            <span
              key={filtro}
              className={`inline-flex h-11 items-center rounded-pill px-4 text-[15px] font-medium ${
                i === 0 ? "bg-dark text-white" : "bg-wash text-n1"
              }`}
            >
              {filtro}
            </span>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {t.itens.map((fatura) => {
            const e = estilos[fatura.estado];
            return (
              <article
                key={fatura.id}
                className={`rounded-card border p-[22px] lg:p-8 ${e.cartao}`}
              >
                <div className="flex flex-col gap-4.5 md:flex-row md:items-center md:justify-between md:gap-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Selo fatura={fatura} />
                    </div>

                    <p
                      className={`mt-3.5 text-[clamp(26px,2.2vw,32px)] leading-[1.1] font-medium tracking-[-0.03em] ${e.valor}`}
                    >
                      R$ <Falta o={fatura.valor} />
                    </p>

                    <p className={`mt-2.5 text-sm ${e.meta}`}>
                      Fatura <Falta o={fatura.numero} /> ·{" "}
                      {fatura.estado === "paga" ? "Paga em " : "Vencimento "}
                      <Falta o={fatura.vencimento} />
                    </p>
                    <p className={`mt-1 text-sm ${e.meta}`}>
                      <Falta o={fatura.produto} />
                    </p>
                  </div>

                  <div className="shrink-0">
                    {fatura.estado === "atrasada" && (
                      <Botao
                        href={`/portal/faturas/${fatura.id}/pagar`}
                        className="border-danger bg-danger hover:border-[#B5251A] hover:bg-[#B5251A]"
                      >
                        Pagar agora
                      </Botao>
                    )}
                    {fatura.estado === "aberta" && (
                      <Botao href={`/portal/faturas/${fatura.id}/pagar`}>Pagar</Botao>
                    )}
                    {fatura.estado === "paga" && (
                      <Botao
                        href={`/portal/faturas/${fatura.id}/recibo`}
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
          })}
        </div>

        <p className="mt-5.5 text-center text-xs leading-relaxed text-n2">
          {t.rodape}
        </p>
      </main>
    </>
  );
}
