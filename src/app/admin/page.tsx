import type { Metadata } from "next";
import Link from "next/link";
import { listarClientes } from "@/db/admin";
import { exigirAdmin } from "@/lib/admin";
import { Marca } from "@/components/ui";
import { BotaoSairAdmin, FormCliente } from "./formularios";

export const metadata: Metadata = { title: "Clientes — Admin courte" };

export default async function Admin() {
  await exigirAdmin();
  const clientes = await listarClientes();

  return (
    <main className="mx-auto w-full max-w-[1000px] px-5 py-8">
      <header className="flex items-center justify-between gap-4 border-b border-line pb-5">
        <div className="flex items-baseline gap-3">
          <Marca />
          <span className="text-sm text-n1">admin</span>
        </div>
        <BotaoSairAdmin />
      </header>

      <h1 className="mt-8 text-[28px] font-medium tracking-[-0.03em]">
        Clientes <span className="text-n2">({clientes.length})</span>
      </h1>

      {clientes.length === 0 ? (
        <p className="mt-4 text-sm text-n1">Nenhum cliente cadastrado ainda.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-n1">
              <tr>
                <th className="py-2 pr-4 font-medium">Nome</th>
                <th className="py-2 pr-4 font-medium">E-mail</th>
                <th className="py-2 pr-4 font-medium">Produtos</th>
                <th className="py-2 pr-4 font-medium">Em aberto</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id} className="border-b border-line">
                  <td className="py-2.5 pr-4">
                    <Link href={`/admin/clientes/${c.id}`} className="text-acc hover:underline">
                      {c.nome}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-4 text-n1">{c.email}</td>
                  <td className="py-2.5 pr-4">{c.produtos}</td>
                  <td className="py-2.5 pr-4">
                    {c.emAberto > 0 ? (
                      <span className="text-danger">{c.emAberto}</span>
                    ) : (
                      <span className="text-n2">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="mt-12 rounded-card border border-line p-6">
        <h2 className="mb-4 text-lg font-medium">Novo cliente</h2>
        <FormCliente />
      </section>
    </main>
  );
}
