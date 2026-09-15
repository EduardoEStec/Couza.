import type { Metadata } from "next";
import Link from "next/link";
import { criarSenha as t } from "@/content/portal";
import { CascaAuth, TituloAcesso } from "@/components/portal/casca-auth";
import { Botao } from "@/components/ui";
import { conferirLink } from "@/db/tokens";
import { FormularioCriarSenha } from "./formulario";

export const metadata: Metadata = {
  title: "Criar senha — Portal do Cliente | courte",
};

export default async function CriarSenha(
  props: PageProps<"/portal/criar-senha/[token]">,
) {
  const { token } = await props.params;

  // Confere sem consumir: quem consome e a acao, quando a senha for gravada.
  const link = await conferirLink(token);

  return (
    <CascaAuth voltar={{ texto: "Voltar ao login", href: "/portal/login" }}>
      <TituloAcesso linhas={t.titulo} />

      {link.valido ? (
        <>
          <p className="mt-3.5 text-h3 leading-[1.2] font-medium tracking-[-0.02em] text-ink">
            {t.assunto}
          </p>
          <p className="mt-3 text-lead text-n1">{t.apoio}</p>
          <FormularioCriarSenha token={token} />
        </>
      ) : (
        <>
          <p className="mt-3.5 text-h3 leading-[1.2] font-medium tracking-[-0.02em] text-ink">
            {t.invalido.assunto}
          </p>
          <p className="mt-3 text-lead text-n1">{t.invalido.texto}</p>
          <div className="mt-8">
            <Botao grande bloco href="/portal/primeiro-acesso">
              {t.invalido.botao}
            </Botao>
          </div>
          <p className="mt-6 text-center text-sm text-n1">
            Já tem senha?{" "}
            <Link
              href="/portal/login"
              className="font-medium text-acc transition-colors duration-200 ease-out-soft hover:text-acc-hover"
            >
              Entrar
            </Link>
          </p>
        </>
      )}
    </CascaAuth>
  );
}
