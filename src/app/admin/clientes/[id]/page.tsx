import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  lerCliente,
  listarFaturas,
  listarProdutos,
  type Produto,
} from "@/db/admin";
import { exigirAdmin } from "@/lib/admin";
import { emDataBr, emReais } from "@/lib/dinheiro";
import { Marca, SetaEsquerda } from "@/components/ui";
import {
  BotaoSairAdmin,
  FormCliente,
  FormCobranca,
  FormProduto,
} from "../../formularios";

export const metadata: Metadata = { title: "Cliente — Admin courte" };

const TIPO: Record<Produto["tipo"], string> = {
  site: "Site",
  sistema: "Sistema",
  manutencao: "Manutenção",
};

const STATUS: Record<Produto["status"], string> = {
  ativo: "Ativo",
  pausado: "Pausado",
  encerrado: "Encerrado",
};

export default async function ClienteAdmin(
  props: PageProps<"/admin/clientes/[id]">,
) {
  await exigirAdmin();
  const { id } = await props.params;

  const cliente = await lerCliente(id);
  if (!cliente) notFound();

  const [produtos, faturas] = await Promise.all([
    listarProdutos(id),
    listarFaturas(id),
  ]);

  return (
    <main className="mx-auto w-full max-w-[1000px] px-5 py-8">
      <header className="flex items-center justify-between gap-4 border-b border-line pb-5">
        <div className="flex items-baseline gap-3">
          <Marca />
          <span className="text-sm text-n1">admin</span>
        </div>
        <BotaoSairAdmin />
      </header>

      <Link
        href="/admin"
        className="mt-6 inline-flex items-center gap-2 text-sm text-n1 hover:text-ink"
      >
        <SetaEsquerda />
        Clientes
      </Link>

      <h1 className="mt-4 text-[28px] font-medium tracking-[-0.03em]">
        {cliente.nome}
      </h1>

      <section className="mt-8 rounded-card border border-line p-6">
        <h2 className="mb-4 text-lg font-medium">Dados do cliente</h2>
        <FormCliente cliente={cliente} />
      </section>

      {/* --- produtos --- */}
      <section className="mt-8">
        <h2 className="text-lg font-medium">
          Produtos <span className="text-n2">({produtos.length})</span>
        </h2>

        {produtos.length === 0 ? (
          <p className="mt-2 text-sm text-n1">Nenhum produto contratado ainda.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            {produtos.map((p) => (
              <details key={p.id} className="rounded-card border border-line p-5">
                <summary className="cursor-pointer text-base font-medium">
                  {p.nome}
                  <span className="ml-2 text-sm font-normal text-n1">
                    {TIPO[p.tipo]} · {STATUS[p.status]}
                    {p.mensalidadeCentavos != null &&
                      ` · R$ ${emReais(p.mensalidadeCentavos)}/mês`}
                    {p.diaVencimento != null && ` · vence dia ${p.diaVencimento}`}
                  </span>
                </summary>
                <div className="mt-5 border-t border-line pt-5">
                  <FormProduto clienteId={id} produto={p} />
                </div>
              </details>
            ))}
          </div>
        )}

        <details className="mt-4 rounded-card border border-line p-5">
          <summary className="cursor-pointer text-base font-medium">
            Adicionar produto
          </summary>
          <div className="mt-5 border-t border-line pt-5">
            <FormProduto clienteId={id} />
          </div>
        </details>
      </section>

      {/* --- cobranca avulsa --- */}
      <section className="mt-8 rounded-card border border-line p-6">
        <h2 className="mb-4 text-lg font-medium">Lançar cobrança avulsa</h2>
        <FormCobranca
          clienteId={id}
          produtos={produtos.map((p) => ({ id: p.id, nome: p.nome }))}
        />
      </section>

      {/* --- faturas --- */}
      <section className="mt-8">
        <h2 className="text-lg font-medium">
          Faturas <span className="text-n2">({faturas.length})</span>
        </h2>

        {faturas.length === 0 ? (
          <p className="mt-2 text-sm text-n1">Nenhuma fatura lançada ainda.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-n1">
                <tr>
                  <th className="py-2 pr-4 font-medium">Nº</th>
                  <th className="py-2 pr-4 font-medium">Descrição</th>
                  <th className="py-2 pr-4 font-medium">Produto</th>
                  <th className="py-2 pr-4 font-medium">Valor</th>
                  <th className="py-2 pr-4 font-medium">Vencimento</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {faturas.map((f) => {
                  const atrasada =
                    f.status === "aberta" && f.vencimento.slice(0, 10) < hoje();
                  return (
                    <tr key={f.id} className="border-b border-line">
                      <td className="py-2.5 pr-4 text-n1">{f.numero}</td>
                      <td className="py-2.5 pr-4">{f.descricao}</td>
                      <td className="py-2.5 pr-4 text-n1">{f.produtoNome ?? "—"}</td>
                      <td className="py-2.5 pr-4">R$ {emReais(f.valorCentavos)}</td>
                      <td className="py-2.5 pr-4">{emDataBr(f.vencimento)}</td>
                      <td className="py-2.5 pr-4">
                        {f.status === "paga" && <span className="text-n1">Paga</span>}
                        {f.status === "cancelada" && (
                          <span className="text-n2">Cancelada</span>
                        )}
                        {f.status === "aberta" &&
                          (atrasada ? (
                            <span className="text-danger">Atrasada</span>
                          ) : (
                            <span className="text-acc">Em aberto</span>
                          ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

/** "Atrasada" e derivada, nao guardada — ver o comentario em db/schema.ts. */
function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}
