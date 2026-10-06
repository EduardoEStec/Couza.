import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { sessaoAdminAtiva } from "@/lib/admin";
import { Marca } from "@/components/ui";
import { FormLogin } from "../formularios";

export const metadata: Metadata = { title: "Admin — couza" };

export default async function LoginAdmin() {
  if (await sessaoAdminAtiva()) redirect("/admin");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[380px] flex-col justify-center gap-8 px-5">
      <div>
        <Marca />
        <h1 className="mt-5 text-[28px] font-medium tracking-[-0.03em]">Admin</h1>
        <p className="mt-2 text-sm text-n1">Área de administração do portal.</p>
      </div>
      <FormLogin />
    </main>
  );
}
