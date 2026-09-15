import type { Metadata } from "next";
import Link from "next/link";
import { verifiqueEmail as t } from "@/content/portal";
import { CascaAuth, TituloAcesso } from "@/components/portal/casca-auth";
import { Botao, Envelope, Falta, Relogio, SetaDiagonal } from "@/components/ui";

export const metadata: Metadata = {
  title: "Verifique seu e-mail — Portal do Cliente | courte",
};

export default async function VerifiqueEmail(
  props: PageProps<"/portal/verifique-email">,
) {
  // O e-mail vem de quem acabou de digitar, so para a tela repetir de volta.
  const { e } = await props.searchParams;
  const email = typeof e === "string" ? e : null;

  return (
    <CascaAuth voltar={{ texto: "Voltar ao login", href: "/portal/login" }}>
      <span className="flex h-16 w-16 items-center justify-center rounded-pill bg-acc-soft">
        <Envelope className="text-acc" />
      </span>

      <TituloAcesso linhas={t.titulo} />
      <p className="mt-3.5 text-h3 leading-[1.2] font-medium tracking-[-0.02em] text-ink">
        {t.assunto}
      </p>
      <p className="mt-3 text-lead text-n1">
        {t.apoio.antes}
        {email ? (
          <strong className="font-medium text-ink">{email}</strong>
        ) : (
          <Falta o={t.apoio.email} />
        )}
        {t.apoio.depois}
      </p>

      <div className="mt-7 flex items-start gap-3 rounded-card bg-wash p-5">
        <Relogio className="mt-0.5 shrink-0 text-n1" />
        <p className="text-sm leading-relaxed text-n1">
          {t.validade.antes}
          <Falta o={t.validade.tempo} />
          {t.validade.depois}
        </p>
      </div>

      <div className="mt-7 flex flex-col gap-3.5">
        {/* So aparece quando da para identificar o provedor pelo dominio do
            e-mail. Em dominio proprio de empresa, some — decisao registrada
            no post-it do canvas. */}
        <Botao grande bloco>
          <SetaDiagonal tamanho={18} />
          {t.abrirEmail}
        </Botao>
        <Botao grande bloco variante="contorno">
          {t.reenviar}
        </Botao>
        <Link
          href="/portal/primeiro-acesso"
          className="py-2 text-center text-sm text-acc transition-colors duration-200 ease-out-soft hover:text-acc-hover"
        >
          {t.outroEmail}
        </Link>
      </div>

      <hr className="my-8 border-0 border-t border-line" />

      <p className="text-center text-xs leading-relaxed text-n2">
        {t.spam.antes}
        <Falta o={t.spam.email} />.
      </p>
    </CascaAuth>
  );
}
