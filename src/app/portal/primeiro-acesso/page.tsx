import type { Metadata } from "next";
import Link from "next/link";
import { primeiroAcesso as t } from "@/content/portal";
import { CascaAuth, TituloAcesso } from "@/components/portal/casca-auth";
import { FormularioPrimeiroAcesso } from "./formulario";

export const metadata: Metadata = {
  title: "Primeiro acesso — Portal do Cliente | courte",
};

export default function PrimeiroAcesso() {
  return (
    <CascaAuth
      voltar={{ texto: "Voltar ao login", href: "/portal/login" }}
      rodape={
        <>
          {t.jaTenho.antes}{" "}
          <Link href="/portal/login" className="text-acc hover:text-acc-hover">
            {t.jaTenho.link}
          </Link>
        </>
      }
    >
      <TituloAcesso linhas={t.titulo} />
      <p className="mt-3.5 text-h3 leading-[1.2] font-medium tracking-[-0.02em] text-ink">
        {t.assunto}
      </p>
      <p className="mt-3 text-lead text-n1">{t.apoio}</p>

      <FormularioPrimeiroAcesso />

      <div className="mt-8 rounded-card bg-wash p-5.5">
        <p className="text-xs uppercase tracking-[0.14em] text-n1">
          O que acontece agora
        </p>
        <ol className="mt-4 flex flex-col gap-3.5">
          {t.passos.map((passo, i) => (
            <li key={passo} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-pill bg-dark text-xs font-medium text-white">
                {i + 1}
              </span>
              <span className="text-sm text-ink">{passo}</span>
            </li>
          ))}
        </ol>
      </div>
    </CascaAuth>
  );
}
