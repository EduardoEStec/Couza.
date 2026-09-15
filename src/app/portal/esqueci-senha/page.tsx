import type { Metadata } from "next";
import Link from "next/link";
import { esqueciSenha as t } from "@/content/portal";
import { Campo, CascaAuth, TituloAcesso } from "@/components/portal/casca-auth";
import { Botao, Envelope } from "@/components/ui";

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

      <div className="mt-8 flex flex-col gap-4.5">
        <Campo rotulo={t.campo} foco dica={t.dica}>
          <Envelope tamanho={19} className="shrink-0 text-n1" />
          <span className="text-n2">seu@email.com</span>
        </Campo>

        <Botao grande bloco className="mt-1.5">
          {t.enviar}
        </Botao>
      </div>
    </CascaAuth>
  );
}
