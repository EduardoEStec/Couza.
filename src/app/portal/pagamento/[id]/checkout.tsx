"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import Image from "next/image";
import { checkout as t } from "@/content/portal";
import { emDataBr, emReais } from "@/lib/dinheiro";
import { TopbarCheckout } from "@/components/portal/topbar";
import {
  Barras,
  Botao,
  Cadeado,
  Cartao,
  Copiar,
  Escudo,
  Fechar,
  Info,
  Pilula,
  QrCode,
  Relogio,
} from "@/components/ui";
import { pagarNoCartao, type EstadoPagamento } from "./acoes";

type Aba = "cartao" | "pix" | "boleto";
const icones = { cartao: Cartao, pix: QrCode, boleto: Barras };

export type CheckoutProps = {
  faturaId: string;
  descricao: string;
  valorCentavos: number;
  vencimento: string;
  atrasada: boolean;
  pagador: { nome: string; documento: string; telefone: string | null };
  pix: { encodedImage: string; payload: string; expirationDate: string } | null;
  boleto: { identificationField: string; barCode: string } | null;
};

export function Checkout(p: CheckoutProps) {
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
        <div
          className={`rounded-card px-6 py-5.5 ${p.atrasada ? "bg-danger-wash" : "bg-wash"}`}
        >
          <p className="text-xs uppercase tracking-[0.14em] text-n1">
            {t.resumo.rotulo}
          </p>
          <p className="mt-2.5 text-[17px] font-medium">{p.descricao}</p>
          <p className="mt-3.5 text-[clamp(34px,3.4vw,46px)] leading-[1.05] font-medium tracking-[-0.035em]">
            R$ {emReais(p.valorCentavos)}
          </p>
          <div className="mt-4 flex items-center justify-between gap-4 border-t border-[#E4E4E4] pt-3.5">
            <span className="text-[15px] text-n1">
              {p.atrasada ? "Venceu em" : "Vencimento"}
            </span>
            <span
              className={`text-[15px] font-medium ${p.atrasada ? "text-danger" : ""}`}
            >
              {emDataBr(p.vencimento)}
            </span>
          </div>
        </div>

        <p className="mt-7 mb-3 text-xs uppercase tracking-[0.14em] text-n1">
          {t.rotuloAbas}
        </p>

        <div role="tablist" className="flex gap-1.5 rounded-pill bg-wash p-1.5">
          {(["cartao", "pix", "boleto"] as const).map((id) => {
            const Icone = icones[id];
            const ativa = aba === id;
            const texto = { cartao: "Cartão", pix: "Pix", boleto: "Boleto" }[id];
            return (
              <button
                key={id}
                role="tab"
                aria-selected={ativa}
                onClick={() => setAba(id)}
                className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-pill px-2.5 text-[15px] font-medium transition-colors duration-200 ease-out-soft ${
                  ativa ? "bg-white text-ink" : "text-n1 hover:text-ink"
                }`}
              >
                <Icone />
                {texto}
              </button>
            );
          })}
        </div>

        {aba === "cartao" && <PainelCartao {...p} />}
        {aba === "pix" && <PainelPix pix={p.pix} />}
        {aba === "boleto" && <PainelBoleto boleto={p.boleto} />}
      </main>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Cartão
 * ------------------------------------------------------------------ */

const campo =
  "min-h-[52px] w-full rounded-btn border border-line px-3.5 text-base text-ink outline-none transition-[border-color,box-shadow] duration-200 ease-out-soft placeholder:text-n2 focus:border-acc focus:shadow-[0_0_0_3px_var(--color-acc-soft)]";

function Campo({
  nome,
  rotulo,
  dica,
  ...resto
}: {
  nome: string;
  rotulo: string;
  dica?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={nome} className="text-sm font-medium text-ink">
        {rotulo}
      </label>
      <input id={nome} name={nome} className={campo} {...resto} />
      {dica && <p className="text-[13px] text-n2">{dica}</p>}
    </div>
  );
}

function PainelCartao(p: CheckoutProps) {
  const [estado, acao, enviando] = useActionState<EstadoPagamento, FormData>(
    pagarNoCartao,
    {},
  );

  return (
    <form action={acao} className="mt-6.5 flex flex-col gap-4.5">
      <input type="hidden" name="faturaId" value={p.faturaId} />

      {/* autoComplete="off" nos campos sensiveis: o navegador nao deve
          guardar numero nem CVV em formulario de terceiro. */}
      <Campo
        nome="numero"
        rotulo={t.cartao.numero.rotulo}
        inputMode="numeric"
        autoComplete="cc-number"
        placeholder="0000 0000 0000 0000"
        maxLength={23}
        required
      />
      <Campo
        nome="titularNome"
        rotulo={t.cartao.nome.rotulo}
        autoComplete="cc-name"
        placeholder="como está no cartão"
        required
      />

      <div className="grid grid-cols-3 gap-3.5">
        <Campo nome="mes" rotulo="Mês" inputMode="numeric" placeholder="MM" maxLength={2} required />
        <Campo nome="ano" rotulo="Ano" inputMode="numeric" placeholder="AAAA" maxLength={4} required />
        <Campo nome="cvv" rotulo="CVV" inputMode="numeric" autoComplete="off" placeholder="000" maxLength={4} required />
      </div>

      <div className="rounded-card bg-wash p-4.5">
        <p className="text-xs uppercase tracking-[0.14em] text-n1">
          Dados do titular
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-n1">
          O Asaas exige todos estes campos para processar cartão. Se o titular
          for outra pessoa, use os dados dela.
        </p>

        <div className="mt-4 flex flex-col gap-4.5">
          <Campo
            nome="titularCpf"
            rotulo="CPF ou CNPJ do titular"
            inputMode="numeric"
            defaultValue={p.pagador.documento}
            required
          />
          <div className="grid grid-cols-2 gap-3.5">
            <Campo nome="titularCep" rotulo="CEP" inputMode="numeric" placeholder="00000-000" required />
            <Campo nome="titularNumero" rotulo="Número" placeholder="123" required />
          </div>
          <Campo
            nome="titularTelefone"
            rotulo="Telefone"
            inputMode="numeric"
            defaultValue={p.pagador.telefone ?? ""}
            placeholder="(00) 00000-0000"
            required
          />
        </div>
      </div>

      {estado.erro && (
        <p role="alert" className="rounded-btn bg-danger-wash px-4 py-3 text-sm leading-relaxed text-danger">
          {estado.erro}
        </p>
      )}

      <Botao grande bloco type="submit" disabled={enviando}>
        {enviando ? "Processando…" : `Pagar R$ ${emReais(p.valorCentavos)}`}
      </Botao>

      <div className="flex items-start gap-2.5 rounded-btn bg-wash px-4 py-3.5">
        <Escudo className="mt-0.5 shrink-0 text-n1" />
        <p className="text-xs leading-relaxed text-n1">
          Os dados do cartão são enviados ao Asaas para processar a cobrança e
          não ficam guardados em lugar nenhum.
        </p>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ *
 * Pix
 * ------------------------------------------------------------------ */

function PainelPix({ pix }: { pix: CheckoutProps["pix"] }) {
  const restante = useContagem(pix?.expirationDate ?? null);

  if (!pix) {
    return (
      <Indisponivel
        o="Pix"
        motivo="Pode ser que a conta ainda não tenha uma chave Pix cadastrada."
      />
    );
  }

  return (
    <div className="mt-6.5 flex flex-col gap-4.5">
      <div className="flex flex-col items-center gap-4.5 rounded-card border border-line p-6">
        <Image
          src={`data:image/png;base64,${pix.encodedImage}`}
          alt="QR Code do Pix"
          width={212}
          height={212}
          unoptimized
          className="max-w-full"
        />
        <p className="max-w-[34ch] text-center text-sm leading-snug text-n1">
          {t.pix.instrucao}
        </p>
      </div>

      <Copiavel rotulo={t.pix.rotuloCodigo} valor={pix.payload} botao={t.pix.copiar} />

      <div className="flex items-start gap-2.5 rounded-btn bg-wash px-4 py-3.5">
        <Relogio className="mt-0.5 shrink-0 text-n1" />
        <div className="text-sm leading-snug text-n1">
          <p>{t.pix.aviso}</p>
          <p className="mt-2 text-xs text-n2">
            {restante
              ? `Este código expira em ${restante}.`
              : `Este código expira em ${emDataBr(pix.expirationDate)}.`}
          </p>
        </div>
      </div>
    </div>
  );
}

/** Conta regressiva até a expiração. Só texto — nada de recarregar sozinho. */
function useContagem(ateIso: string | null): string | null {
  const [texto, setTexto] = useState<string | null>(null);

  useEffect(() => {
    if (!ateIso) return;
    const alvo = new Date(ateIso).getTime();
    if (Number.isNaN(alvo)) return;

    const atualizar = () => {
      const faltam = alvo - Date.now();
      if (faltam <= 0) return setTexto("já expirou");
      const h = Math.floor(faltam / 3_600_000);
      const m = Math.floor((faltam % 3_600_000) / 60_000);
      const s = Math.floor((faltam % 60_000) / 1000);
      setTexto(h > 0 ? `${h}h ${m}min` : `${m}min ${String(s).padStart(2, "0")}s`);
    };

    atualizar();
    const id = setInterval(atualizar, 1000);
    return () => clearInterval(id);
  }, [ateIso]);

  return texto;
}

/* ------------------------------------------------------------------ *
 * Boleto
 * ------------------------------------------------------------------ */

function PainelBoleto({ boleto }: { boleto: CheckoutProps["boleto"] }) {
  if (!boleto) {
    return <Indisponivel o="Boleto" motivo="O Asaas ainda não gerou o boleto desta cobrança." />;
  }

  return (
    <div className="mt-6.5 flex flex-col gap-4.5">
      <Copiavel
        rotulo={t.boleto.rotuloLinha}
        valor={boleto.identificationField}
        botao={t.boleto.copiar}
      />

      <div className="flex items-start gap-2.5 rounded-btn bg-wash px-4 py-3.5">
        <Info className="mt-0.5 shrink-0 text-n1" />
        <p className="text-sm leading-snug text-n1">{t.boleto.aviso}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Peças comuns
 * ------------------------------------------------------------------ */

function Copiavel({
  rotulo,
  valor,
  botao,
}: {
  rotulo: string;
  valor: string;
  botao: string;
}) {
  const [copiado, setCopiado] = useState(false);

  return (
    <div className="flex flex-col gap-3 rounded-btn border border-line p-3.5">
      <p className="text-sm font-medium">{rotulo}</p>
      <p className="text-xs leading-relaxed break-all text-n1">{valor}</p>
      <Botao
        bloco
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(valor);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2500);
          } catch {
            // Sem permissão de área de transferência: o código está na tela,
            // dá para selecionar e copiar na mão. Não vale quebrar a tela.
            setCopiado(false);
          }
        }}
      >
        <Copiar />
        {copiado ? "Copiado" : botao}
      </Botao>
    </div>
  );
}

function Indisponivel({ o, motivo }: { o: string; motivo: string }) {
  return (
    <div className="mt-6.5 rounded-card border border-dashed border-line px-6 py-10 text-center">
      <p className="text-[15px] font-medium">{o} indisponível para esta cobrança.</p>
      <p className="mx-auto mt-2 max-w-[38ch] text-sm text-n1">
        {motivo} Use outra forma de pagamento ou me chame.
      </p>
    </div>
  );
}
