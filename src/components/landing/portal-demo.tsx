"use client";

import { useState } from "react";
import { portalDemo as t } from "@/content/site";
import { Alerta, Botao, Camadas, Check, Pilula, Sobretitulo } from "@/components/ui";
import { Entrar } from "@/components/movimento";

type Aba = "produtos" | "faturas";
type Filtro = (typeof t.filtros)[number]["chave"];

const CASCA: Record<(typeof t.faturas)[number]["status"], string> = {
  atrasada: "bg-danger-wash border-[#F7D2CE]",
  paga: "bg-wash border-transparent",
  aberta: "bg-white border-line",
};

export function PortalDemo() {
  const [aba, setAba] = useState<Aba>("produtos");
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [aviso, setAviso] = useState<string | null>(null);

  const faturas =
    filtro === "todas" ? t.faturas : t.faturas.filter((f) => f.status === filtro);

  return (
    <Entrar atraso={0.32} className="mt-10 lg:mt-16">
      <Sobretitulo>{t.sobretitulo}</Sobretitulo>
      <h3 className="mt-3 max-w-[24ch] text-h3">{t.titulo}</h3>
      <p className="mt-2.5 max-w-[46ch] text-sm text-n1">{t.texto}</p>

      <div className="mt-6 overflow-hidden rounded-card border border-line bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-line bg-wash px-5 py-3.5 sm:px-7">
          <span className="text-sm font-medium text-n1">{t.aviso}</span>
          <div className="flex gap-1.5">
            {(["produtos", "faturas"] as const).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => {
                  setAba(a);
                  setAviso(null);
                }}
                aria-current={aba === a ? "page" : undefined}
                className={`inline-flex h-9 items-center rounded-pill px-3.5 text-[13px] font-medium transition-colors duration-200 ease-out-soft ${
                  aba === a ? "bg-dark text-white" : "bg-white text-n1 hover:text-ink"
                }`}
              >
                {t.abas[a]}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 sm:p-7 lg:p-8">
          {aba === "produtos" ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {t.produtos.map((p) => (
                <article
                  key={p.nome}
                  className="rounded-card border border-line p-[22px] lg:p-7"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3.5">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-acc-soft">
                        <Camadas tamanho={22} className="text-acc" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-[21px] tracking-[-0.02em]">
                          {p.nome}
                        </h3>
                        <p className="mt-1.5 text-sm text-n1">{p.tipo}</p>
                      </div>
                    </div>
                    <Pilula tom="acc" ponto>
                      Ativo
                    </Pilula>
                  </div>

                  <dl className="mt-5.5">
                    <Linha rotulo="Mensalidade">{p.mensalidade}</Linha>
                    <Linha rotulo="Próxima cobrança">{p.proximaCobranca}</Linha>
                    <Linha rotulo="Ativo desde">{p.ativoDesde}</Linha>
                  </dl>

                  <div className="mt-6.5">
                    <p className="text-xs uppercase tracking-[0.14em] text-n1">
                      Cobranças avulsas
                    </p>
                    {p.avulsa ? (
                      <div className="mt-3.5 flex flex-col gap-3.5 rounded-[20px] bg-wash px-4.5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-[15px] font-medium">
                            {p.avulsa.descricao}
                          </p>
                          <p className="mt-1.5 text-xs text-n2">
                            {p.avulsa.vencimento}
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[17px] font-medium">
                            {p.avulsa.valor}
                          </p>
                          <Botao
                            type="button"
                            onClick={() => setAviso(t.cliqueAvulsa)}
                            className="min-h-11 px-4.5 text-[15px]"
                          >
                            Pagar
                          </Botao>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3.5 rounded-[20px] border border-dashed border-line p-4 text-center text-sm text-n1">
                        {t.semAvulsas}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {t.filtros.map((f) => (
                  <button
                    key={f.chave}
                    type="button"
                    onClick={() => setFiltro(f.chave)}
                    aria-current={filtro === f.chave ? "page" : undefined}
                    className={`inline-flex h-10 items-center rounded-pill px-3.5 text-sm font-medium transition-colors duration-200 ease-out-soft ${
                      filtro === f.chave
                        ? "bg-dark text-white"
                        : "bg-wash text-n1 hover:text-ink"
                    }`}
                  >
                    {f.texto}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex flex-col gap-3">
                {faturas.map((f) => (
                  <article
                    key={f.id}
                    className={`rounded-card border p-[18px] ${CASCA[f.status]}`}
                  >
                    <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                          {f.status === "atrasada" && (
                            <Pilula tom="perigo" className="bg-white">
                              <Alerta />
                              Atrasada
                            </Pilula>
                          )}
                          {f.status === "aberta" && (
                            <Pilula tom="acc" ponto>
                              Em aberto
                            </Pilula>
                          )}
                          {f.status === "paga" && (
                            <Pilula tom="neutra" className="bg-white">
                              <Check tamanho={13} />
                              Paga
                            </Pilula>
                          )}
                        </div>
                        <p className="mt-2.5 text-lg font-medium tracking-[-0.02em]">
                          {f.valor}
                        </p>
                        <p className="mt-1 text-sm text-n1">
                          Fatura {f.numero} · {f.descricao}
                        </p>
                        <p className="mt-0.5 text-sm text-n1">{f.meta}</p>
                      </div>

                      <div className="shrink-0">
                        {f.status === "paga" ? (
                          <Botao
                            type="button"
                            variante="contorno"
                            onClick={() => setAviso(t.cliqueRecibo)}
                            className="bg-white"
                          >
                            Recibo
                          </Botao>
                        ) : (
                          <Botao
                            type="button"
                            onClick={() => setAviso(t.cliquePagar)}
                            className={
                              f.status === "atrasada"
                                ? "border-danger bg-danger hover:border-[#B5251A] hover:bg-[#B5251A]"
                                : ""
                            }
                          >
                            Pagar
                          </Botao>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          {aviso && (
            <p className="mt-4.5 text-sm text-n1">{aviso}</p>
          )}
        </div>
      </div>
    </Entrar>
  );
}

function Linha({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-line py-3.5 first:border-t-0">
      <dt className="text-[15px] text-n1">{rotulo}</dt>
      <dd className="m-0 text-right text-[15px] font-medium">{children}</dd>
    </div>
  );
}
