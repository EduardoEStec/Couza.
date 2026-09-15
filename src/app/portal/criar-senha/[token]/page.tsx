import type { Metadata } from "next";
import { criarSenha as t } from "@/content/portal";
import { Campo, CascaAuth, TituloAcesso } from "@/components/portal/casca-auth";
import { Botao, Olho } from "@/components/ui";

export const metadata: Metadata = {
  title: "Criar senha — Portal do Cliente | courte",
};

/**
 * A validacao do token ainda nao existe — entra junto com o fluxo de
 * primeiro acesso. Quando existir, esta tela ganha o segundo estado, que
 * ja esta escrito em `criarSenha.invalido`: link vencido ou ja usado.
 */
export default function CriarSenha() {
  return (
    <CascaAuth voltar={{ texto: "Voltar ao login", href: "/portal/login" }}>
      <TituloAcesso linhas={t.titulo} />
      <p className="mt-3.5 text-h3 leading-[1.2] font-medium tracking-[-0.02em] text-ink">
        {t.assunto}
      </p>
      <p className="mt-3 text-lead text-n1">{t.apoio}</p>

      <div className="mt-8 flex flex-col gap-4.5">
        <Campo rotulo={t.campos.senha} foco dica={t.regra}>
          <span className="flex-1 tracking-[0.22em] text-ink">••••••••••</span>
          <Olho className="shrink-0 text-n1" />
        </Campo>

        <Campo rotulo={t.campos.confirmar}>
          <span className="flex-1 tracking-[0.22em] text-n2">••••••••••</span>
          <Olho className="shrink-0 text-n1" />
        </Campo>

        <Botao grande bloco className="mt-1.5">
          {t.enviar}
        </Botao>
      </div>
    </CascaAuth>
  );
}
