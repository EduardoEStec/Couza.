"use client";

import Link from "next/link";
import { useState } from "react";
import { checkout as t } from "@/content/portal";
import { TopbarCheckout } from "@/components/portal/topbar";
import {
  Barras,
  Botao,
  Cadeado,
  Cartao,
  Chevron,
  Copiar,
  Escudo,
  Falta,
  Fechar,
  Info,
  Baixar,
  Pilula,
  QrCode,
  Relogio,
} from "@/components/ui";

type Aba = (typeof t.abas)[number]["id"];
const icones = { cartao: Cartao, pix: QrCode, boleto: Barras };

function Campo({
  rotulo,
  children,
  dica,
}: {
  rotulo: string;
  children: React.ReactNode;
  dica?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{rotulo}</span>
      <div className="flex min-h-[52px] items-center justify-between gap-2 rounded-btn border border-line px-3.5 text-base">
        {children}
      </div>
      {dica && <p className="text-[13px] text-n2">{dica}</p>}
    </div>
  );
}

function Aviso({
  icone: Icone,
  children,
}: {
  icone: typeof Info;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-btn bg-wash px-4 py-3.5">
      <Icone className="mt-0.5 shrink-0 text-n1" />
      <div className="text-sm leading-snug text-n1">{children}</div>
    </div>
  );
}

export default function Pagar() {
  const [aba, setAba] = useState<Aba>("cartao");

  return (
    <>
      <TopbarCheckout>
        <Pilula tom="neutra">
          <Cadeado />
          {t.seguro}
        </Pilula>
        <Link
          href="/portal/faturas"
          aria-label="Sair do pagamento"
          className="flex h-10 w-10 items-center justify-center rounded-pill text-n1 transition-colors duration-200 ease-out-soft hover:bg-wash hover:text-ink"
        >
          <Fechar />
        </Link>
      </TopbarCheckout>

      <main className="mx-auto w-full max-w-[560px] px-5 pt-6 pb-12 sm:px-8 lg:pt-10 lg:pb-16">
        <div className="rounded-card bg-wash px-6 py-5.5">
          <p className="text-xs uppercase tracking-[0.14em] text-n1">
            {t.resumo.rotulo}
          </p>
          <p className="mt-2.5 text-[17px] font-medium">
            <Falta o={t.resumo.descricao} />
          </p>
          <p className="mt-3.5 text-[clamp(34px,3.4vw,46px)] leading-[1.05] font-medium tracking-[-0.035em]">
            R$ <Falta o={t.resumo.valor} />
          </p>
          <div className="mt-4 flex items-center justify-between gap-4 border-t border-[#E4E4E4] pt-3.5">
            <span className="text-[15px] text-n1">Vencimento</span>
            <span className="text-[15px] font-medium">
              <Falta o={t.resumo.vencimento} />
            </span>
          </div>
        </div>

        <p className="mt-7 mb-3 text-xs uppercase tracking-[0.14em] text-n1">
          {t.rotuloAbas}
        </p>

        <div role="tablist" className="flex gap-1.5 rounded-pill bg-wash p-1.5">
          {t.abas.map((item) => {
            const Icone = icones[item.id];
            const ativa = aba === item.id;
            return (
              <button
                key={item.id}
                role="tab"
                aria-selected={ativa}
                onClick={() => setAba(item.id)}
                className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-pill px-2.5 text-[15px] font-medium transition-colors duration-200 ease-out-soft ${
                  ativa ? "bg-white text-ink" : "text-n1 hover:text-ink"
                }`}
              >
                <Icone />
                {item.texto}
              </button>
            );
          })}
        </div>

        {aba === "cartao" && (
          <div className="mt-6.5 flex flex-col gap-4.5">
            <Campo rotulo={t.cartao.numero.rotulo}>
              <Falta o={t.cartao.numero.exemplo} />
              <Cartao tamanho={24} className="shrink-0 text-n2" />
            </Campo>
            <Campo rotulo={t.cartao.nome.rotulo}>
              <Falta o={t.cartao.nome.exemplo} />
            </Campo>
            <div className="grid grid-cols-2 gap-3.5">
              <Campo rotulo={t.cartao.validade.rotulo}>
                <Falta o={t.cartao.validade.exemplo} />
              </Campo>
              <Campo rotulo={t.cartao.cvv.rotulo}>
                <Falta o={t.cartao.cvv.exemplo} />
              </Campo>
            </div>
            <Campo rotulo={t.cartao.cpf.rotulo}>
              <Falta o={t.cartao.cpf.exemplo} />
            </Campo>
            <Campo
              rotulo={t.cartao.parcelas.rotulo}
              dica={
                <>
                  Parcelamento e juros: <Falta o={t.cartao.parcelas.dica} />.
                </>
              }
            >
              <Falta o={t.cartao.parcelas.exemplo} />
              <Chevron className="shrink-0 text-n1" />
            </Campo>

            <Botao grande bloco className="mt-1.5">
              {t.cartao.pagar}
              <Falta o={t.resumo.valor} tom="escuro" />
            </Botao>

            <Aviso icone={Escudo}>{t.cartao.seguranca}</Aviso>
          </div>
        )}

        {aba === "pix" && (
          <div className="mt-6.5 flex flex-col gap-4.5">
            <div className="flex flex-col items-center gap-4.5 rounded-card border border-line p-6">
              <QrPlaceholder />
              <Falta o={t.pix.qr} />
              <p className="max-w-[34ch] text-center text-sm leading-snug text-n1">
                {t.pix.instrucao}
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-btn border border-line p-3.5">
              <p className="text-sm font-medium">{t.pix.rotuloCodigo}</p>
              <p className="text-xs leading-relaxed break-all text-n2">
                <Falta o={t.pix.codigo} />
              </p>
              <Botao bloco>
                <Copiar />
                {t.pix.copiar}
              </Botao>
            </div>

            <Aviso icone={Relogio}>
              <p>{t.pix.aviso}</p>
              <p className="mt-2 text-xs text-n2">
                {t.pix.validade.antes}
                <Falta o={t.pix.validade.tempo} />.
              </p>
            </Aviso>
          </div>
        )}

        {aba === "boleto" && (
          <div className="mt-6.5 flex flex-col gap-4.5">
            <div className="rounded-card border border-line p-6">
              <div
                className="h-18 rounded-[6px]"
                style={{
                  background:
                    "repeating-linear-gradient(90deg,#191919 0 2px,#fff 2px 5px,#191919 5px 8px,#fff 8px 10px,#191919 10px 13px,#fff 13px 18px,#191919 18px 19px,#fff 19px 23px)",
                }}
              />
              <p className="mt-3.5 text-center text-xs">
                <Falta o={t.boleto.codigoBarras} />
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-btn border border-line p-3.5">
              <p className="text-sm font-medium">{t.boleto.rotuloLinha}</p>
              <p className="text-xs leading-relaxed break-all">
                <Falta o={t.boleto.linha} />
              </p>
              <Botao bloco>
                <Copiar />
                {t.boleto.copiar}
              </Botao>
            </div>

            <Botao grande bloco variante="contorno">
              <Baixar />
              {t.boleto.baixar}
            </Botao>

            <Aviso icone={Info}>
              <p>{t.boleto.aviso}</p>
              <p className="mt-2 text-xs text-n2">
                {t.boleto.compensacao.antes}
                <Falta o={t.boleto.compensacao.prazo} />.
              </p>
            </Aviso>
          </div>
        )}
      </main>
    </>
  );
}

/** Marcador de QR ate o Asaas devolver o codigo de verdade. */
function QrPlaceholder() {
  const modulos = [
    [49, 20], [61, 20], [55, 32], [20, 49], [32, 55], [49, 49],
    [61, 61], [73, 49], [85, 55], [97, 49], [49, 73], [61, 85],
    [73, 97], [85, 85], [97, 97], [85, 73], [49, 97],
  ];
  return (
    <svg width="212" height="212" viewBox="0 0 120 120" fill="none" className="max-w-full" aria-hidden>
      <rect x="1" y="1" width="118" height="118" rx="10" stroke="#EAEAEA" strokeWidth="1.5" strokeDasharray="7 7" />
      {[[14.5, 14.5], [81.5, 14.5], [14.5, 81.5]].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="24" height="24" rx="5" stroke="#191919" strokeWidth="5" />
      ))}
      {modulos.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="6" height="6" rx="1.5" fill="#191919" />
      ))}
    </svg>
  );
}
