import type { Metadata } from "next";
import { produtos as t } from "@/content/portal";
import { exigirSessao } from "@/lib/sessao";
import {
  produtosDoCliente,
  resumoDoCliente,
  type AvulsaDoProduto,
  type ProdutoDoCliente,
} from "@/db/portal";
import { emDataBr, emReais } from "@/lib/dinheiro";
import { TopbarPortal } from "@/components/portal/topbar";
import { Botao, Camadas, Check, Ciclo, Pilula, Tela } from "@/components/ui";

export const metadata: Metadata = {
  title: "Meus Produtos — Portal do Cliente | couza",
};

const icones = { site: Tela, sistema: Camadas, manutencao: Ciclo };
const TIPO = { site: "Site", sistema: "Sistema", manutencao: "Manutenção" };
const STATUS = {
  ativo: { texto: "Ativo", tom: "acc" as const },
  pausado: { texto: "Pausado", tom: "neutra" as const },
  encerrado: { texto: "Encerrado", tom: "neutra" as const },
};

function Linha({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-line py-3.5 first:border-t-0">
      <dt className="text-[15px] text-n1">{rotulo}</dt>
      <dd className="m-0 text-right text-[15px] font-medium">{children}</dd>
    </div>
  );
}

export default async function MeusProdutos() {
  const sessao = await exigirSessao();
  const [lista, resumo] = await Promise.all([
    produtosDoCliente(sessao.clienteId),
    resumoDoCliente(sessao.clienteId),
  ]);

  const temResumo =
    resumo.totalMensalCentavos > 0 ||
    resumo.atrasadasQtd > 0 ||
    resumo.aVencerQtd > 0;

  return (
    <>
      <TopbarPortal ativo="/portal" />

      <main className="mx-auto w-full max-w-[1280px] px-5 pb-12 sm:px-8 lg:px-14 lg:pb-18">
        <div className="pt-7 pb-5 lg:pt-12 lg:pb-7">
          <h1 className="text-[clamp(30px,3.2vw,46px)]">
            {t.saudacao.antes}
            {sessao.nome}
          </h1>
          <p className="mt-3.5 text-[17px] text-n1">{t.apoio}</p>
        </div>

        {/* Resumo do topo — pedido no ETAPAS.md, nao existia no canvas. */}
        {temResumo && (
          <div className="mb-4 grid gap-px overflow-hidden rounded-card bg-line sm:grid-cols-3">
            <Numero
              rotulo="Total mensal"
              valor={`R$ ${emReais(resumo.totalMensalCentavos)}`}
            />
            <Numero
              rotulo="Em atraso"
              valor={
                resumo.atrasadasQtd === 0
                  ? "nada"
                  : `R$ ${emReais(resumo.atrasadasCentavos)}`
              }
              detalhe={plural(resumo.atrasadasQtd)}
              alerta={resumo.atrasadasQtd > 0}
            />
            <Numero
              rotulo="A vencer"
              valor={
                resumo.aVencerQtd === 0
                  ? "nada"
                  : `R$ ${emReais(resumo.aVencerCentavos)}`
              }
              detalhe={plural(resumo.aVencerQtd)}
            />
          </div>
        )}

        {lista.length === 0 ? (
          <div className="rounded-card border border-dashed border-line px-6 py-14 text-center">
            <p className="text-[17px] font-medium">Nenhum produto por aqui ainda.</p>
            <p className="mx-auto mt-2 max-w-[42ch] text-sm text-n1">
              Assim que a gente fechar alguma coisa, ela aparece nesta tela — com
              a mensalidade e as cobranças de cada uma.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2 xl:gap-6">
            {lista.map((p) => (
              <CardProduto key={p.id} produto={p} />
            ))}
          </div>
        )}

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

function plural(n: number): string | undefined {
  if (n === 0) return undefined;
  return `${n} fatura${n > 1 ? "s" : ""}`;
}

function Numero({
  rotulo,
  valor,
  detalhe,
  alerta,
}: {
  rotulo: string;
  valor: string;
  detalhe?: string;
  alerta?: boolean;
}) {
  return (
    <div className="bg-white p-5 lg:p-6">
      <p className="text-xs uppercase tracking-[0.14em] text-n1">{rotulo}</p>
      <p
        className={`mt-2 text-[22px] font-medium tracking-[-0.03em] lg:text-[26px] ${
          alerta ? "text-danger" : ""
        }`}
      >
        {valor}
      </p>
      {detalhe && <p className="mt-1 text-[13px] text-n2">{detalhe}</p>}
    </div>
  );
}

function CardProduto({ produto: p }: { produto: ProdutoDoCliente }) {
  const Icone = icones[p.tipo];
  const status = STATUS[p.status];

  return (
    <article className="rounded-card border border-line p-[22px] lg:p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-acc-soft">
            <Icone tamanho={22} className="text-acc" />
          </span>
          <div className="min-w-0">
            <h2 className="text-[21px] tracking-[-0.02em]">{p.nome}</h2>
            <p className="mt-1.5 text-sm text-n1">
              {TIPO[p.tipo]}
              {p.descricao && ` · ${p.descricao}`}
            </p>
          </div>
        </div>
        <Pilula tom={status.tom} ponto={p.status === "ativo"}>
          {status.texto}
        </Pilula>
      </div>

      <dl className="mt-5.5">
        {p.mensalidadeCentavos != null && (
          <Linha rotulo="Mensalidade">R$ {emReais(p.mensalidadeCentavos)} /mês</Linha>
        )}
        {p.proximaCobranca && (
          <Linha rotulo="Próxima cobrança">{emDataBr(p.proximaCobranca)}</Linha>
        )}
        {p.ativoDesde && <Linha rotulo="Ativo desde">{emDataBr(p.ativoDesde)}</Linha>}
        {p.endereco && <Linha rotulo="Endereço">{p.endereco}</Linha>}
      </dl>

      <div className="mt-6.5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.14em] text-n1">
            Cobranças avulsas
          </p>
          {p.avulsas.length > 0 && (
            <Pilula tom="neutra" className="h-6.5 text-xs">
              {p.avulsas.length}
            </Pilula>
          )}
        </div>

        {p.avulsas.length === 0 ? (
          <div className="mt-3.5 rounded-[20px] border border-dashed border-line p-4 text-center text-sm text-n1">
            {t.semAvulsas}
          </div>
        ) : (
          <div className="mt-3.5 flex flex-col gap-2.5">
            {p.avulsas.map((a) => (
              <Avulsa key={a.id} avulsa={a} />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function Avulsa({ avulsa: a }: { avulsa: AvulsaDoProduto }) {
  const paga = a.statusExibido === "paga";
  const atrasada = a.statusExibido === "atrasada";

  return (
    <div className="flex flex-col gap-3.5 rounded-[20px] bg-wash px-4.5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className={`text-[15px] font-medium ${paga ? "text-n1" : ""}`}>
          {a.descricao}
        </p>
        <p className="mt-1.5 text-xs text-n2">
          {paga
            ? `Paga em ${emDataBr(a.pagoEm)}`
            : `${atrasada ? "Venceu em" : "Vence em"} ${emDataBr(a.vencimento)}`}
        </p>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="text-right">
          <p className={`text-[17px] font-medium ${paga ? "text-n1" : ""}`}>
            R$ {emReais(a.valorCentavos)}
          </p>
          <span className="mt-1.5 inline-block">
            {paga && (
              <Pilula tom="neutra" className="h-6 bg-white text-xs">
                <Check tamanho={12} />
                Paga
              </Pilula>
            )}
            {atrasada && (
              <Pilula tom="perigo" className="h-6 bg-white text-xs">
                Atrasada
              </Pilula>
            )}
            {a.statusExibido === "aberta" && (
              <Pilula tom="acc" ponto className="h-6 text-xs">
                Em aberto
              </Pilula>
            )}
          </span>
        </div>
        {paga ? (
          <Botao
            href={`/portal/faturas/${a.id}/recibo`}
            variante="contorno"
            className="min-h-11 bg-white px-4.5 text-[15px]"
          >
            Recibo
          </Botao>
        ) : (
          <Botao
            href={`/portal/pagamento/${a.id}`}
            className={`min-h-11 px-4.5 text-[15px] ${
              atrasada
                ? "border-danger bg-danger hover:border-[#B5251A] hover:bg-[#B5251A]"
                : ""
            }`}
          >
            Pagar
          </Botao>
        )}
      </div>
    </div>
  );
}
