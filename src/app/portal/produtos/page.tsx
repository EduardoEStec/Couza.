import type { Metadata } from "next";
import { produtos as t } from "@/content/portal";
import { TopbarPortal } from "@/components/portal/topbar";
import {
  Botao,
  Camadas,
  Check,
  Falta,
  Pilula,
  Tela,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "Meus Produtos — Portal do Cliente | courte",
};

const icones = { tela: Tela, camadas: Camadas };

function Linha({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-line py-3.5 first:border-t-0">
      <dt className="text-[15px] text-n1">{rotulo}</dt>
      <dd className="m-0 text-right text-[15px] font-medium">{children}</dd>
    </div>
  );
}

export default function Produtos() {
  return (
    <>
      <TopbarPortal ativo="/portal/produtos" />

      <main className="mx-auto w-full max-w-[1280px] px-5 pb-12 sm:px-8 lg:px-14 lg:pb-18">
        <div className="pt-7 pb-5 lg:pt-12 lg:pb-7">
          <h1 className="text-[clamp(30px,3.2vw,46px)]">
            {t.saudacao.antes}
            <Falta o={t.saudacao.nome} />
          </h1>
          <p className="mt-3.5 text-[17px] text-n1">{t.apoio}</p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2 xl:gap-6">
          {t.itens.map((produto, i) => {
            const Icone = icones[produto.icone];
            return (
              <article key={i} className="rounded-card border border-line p-[22px] lg:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-acc-soft">
                      <Icone tamanho={22} className="text-acc" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-[21px] tracking-[-0.02em]">
                        <Falta o={produto.nome} />
                      </h2>
                      <p className="mt-1.5 text-sm">
                        <Falta o={produto.tipo} />
                      </p>
                    </div>
                  </div>
                  <Pilula tom="acc" ponto>
                    Ativo
                  </Pilula>
                </div>

                <dl className="mt-5.5">
                  <Linha rotulo="Mensalidade">
                    R$ <Falta o={produto.mensalidade} /> /mês
                  </Linha>
                  <Linha rotulo="Próxima cobrança">
                    <Falta o={produto.proximaCobranca} />
                  </Linha>
                  <Linha rotulo="Ativo desde">
                    <Falta o={produto.desde} />
                  </Linha>
                  {produto.endereco && (
                    <Linha rotulo="Endereço">
                      <Falta o={produto.endereco} />
                    </Linha>
                  )}
                </dl>

                <div className="mt-6.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-n1">
                      Cobranças avulsas
                    </p>
                    {produto.avulsas.length > 0 && (
                      <Pilula tom="neutra" className="h-6.5 text-xs">
                        {produto.avulsas.length}
                      </Pilula>
                    )}
                  </div>

                  {produto.avulsas.length === 0 ? (
                    <div className="mt-3.5 rounded-[20px] border border-dashed border-line p-4 text-center text-sm text-n1">
                      {t.semAvulsas}
                    </div>
                  ) : (
                    <div className="mt-3.5 flex flex-col gap-2.5">
                      {produto.avulsas.map((avulsa, j) => {
                        const paga = avulsa.estado === "paga";
                        return (
                          <div
                            key={j}
                            className="flex flex-col gap-3.5 rounded-[20px] bg-wash px-4.5 py-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <p className={`text-[15px] font-medium ${paga ? "text-n1" : ""}`}>
                                <Falta o={avulsa.descricao} />
                              </p>
                              <p className="mt-1.5 text-xs text-n2">
                                {paga ? "Paga em " : "Vence em "}
                                <Falta o={avulsa.data} />
                              </p>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-right">
                                <p className={`text-[17px] font-medium ${paga ? "text-n1" : ""}`}>
                                  R$ <Falta o={avulsa.valor} />
                                </p>
                                <span className="mt-1.5 inline-block">
                                  {paga ? (
                                    <Pilula tom="neutra" className="h-6 bg-white text-xs">
                                      <Check tamanho={12} />
                                      Paga
                                    </Pilula>
                                  ) : (
                                    <Pilula tom="acc" ponto className="h-6 text-xs">
                                      Em aberto
                                    </Pilula>
                                  )}
                                </span>
                              </div>
                              {paga ? (
                                <Botao
                                  href="/portal/faturas/1/recibo"
                                  variante="contorno"
                                  className="min-h-11 bg-white px-4.5 text-[15px]"
                                >
                                  Recibo
                                </Botao>
                              ) : (
                                <Botao
                                  href="/portal/faturas/1/pagar"
                                  className="min-h-11 px-4.5 text-[15px]"
                                >
                                  Pagar
                                </Botao>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-4 flex flex-col gap-3.5 rounded-card bg-wash p-[22px] lg:p-8">
          <p className="text-sm leading-relaxed text-n1">{t.orcamento.texto}</p>
          <Botao
            href="/#contato"
            variante="contorno"
            className="min-h-11 self-start bg-white px-4.5 text-[15px]"
          >
            {t.orcamento.botao}
          </Botao>
        </div>
      </main>
    </>
  );
}
