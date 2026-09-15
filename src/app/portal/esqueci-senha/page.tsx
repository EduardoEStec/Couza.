import type { Metadata } from "next";
import Link from "next/link";
import { esqueciSenha as t } from "@/content/portal";
import { CascaAuth, TituloAcesso } from "@/components/portal/casca-auth";
import { FormularioEsqueciSenha } from "./formulario";

export const metadata: Metadata = {
  title: "Esqueci minha senha — Portal do Cliente | courte",
};

export default function EsqueciSenha() {
  return (
    <CascaAuth
      voltar={{ texto: "Voltar ao login", href: "/portal/login" }}
      rodape={
        <>
          {t.lembrei.antes}{" "}
          <Link href="/portal/login" className="text-acc hover:text-acc-hover">
            {t.lembrei.link}
          </Link>
        </>
      }
    >
      <TituloAcesso linhas={t.titulo} />
      <p className="mt-3.5 text-h3 leading-[1.2] font-medium tracking-[-0.02em] text-ink">
        {t.assunto}
      </p>
      <p className="mt-3 text-lead text-n1">{t.apoio}</p>

      <FormularioEsqueciSenha />
    </CascaAuth>
  );
}
