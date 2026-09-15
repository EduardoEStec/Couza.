import type { Metadata } from "next";
import Link from "next/link";
import { login } from "@/content/portal";
import { CascaAuth, TituloAcesso } from "@/components/portal/casca-auth";
import { Caixa, Falta, Marca, Nota, Cartao } from "@/components/ui";
import { FormularioLogin } from "./formulario";
import { marca } from "@/content/site";

export const metadata: Metadata = {
  title: "Entrar — Portal do Cliente | courte",
};

const iconesPainel = [Caixa, Nota, Cartao];

export default async function Login(props: PageProps<"/portal/login">) {
  // Vem do e-mail de cobranca: /portal/login?voltar=/portal/pagamento/<id>.
  // Quem decide se o destino presta e a acao de login, nao esta tela.
  const { voltar } = await props.searchParams;
  return (
    <CascaAuth
      voltar={{ texto: "Voltar ao site", href: "/" }}
      painel={
        <>
          <Marca escuro />
          <div>
            <h2 className="max-w-[16ch] text-[clamp(34px,3.2vw,46px)] leading-[1.05]">
              {login.painel.titulo}
            </h2>
            <ul className="mt-9 flex flex-col gap-4.5">
              {login.painel.itens.map((item, i) => {
                const Icone = iconesPainel[i];
                return (
                  <li key={item} className="flex items-start gap-3.5 text-base leading-snug text-n2">
                    <Icone tamanho={20} className="mt-0.5 shrink-0 text-acc" />
                    {item}
                  </li>
                );
              })}
            </ul>
          </div>
          <p className="text-xs text-n1">© 2026 courte.com.br</p>
        </>
      }
      rodape={
        <>
          {login.ajuda}
          <Falta o={marca.email} />
        </>
      }
    >
      <TituloAcesso linhas={login.titulo} />
      <p className="mt-4 text-lead text-n1">{login.apoio}</p>

      <FormularioLogin voltar={typeof voltar === "string" ? voltar : ""} />

      <hr className="my-8 border-0 border-t border-line" />

      <p className="text-center text-sm text-n1">
        {login.primeiroAcesso.antes}{" "}
        <Link
          href="/portal/primeiro-acesso"
          className="font-medium text-acc transition-colors duration-200 ease-out-soft hover:text-acc-hover"
        >
          {login.primeiroAcesso.link}
        </Link>
      </p>
    </CascaAuth>
  );
}
