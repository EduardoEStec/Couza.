import Link from "next/link";
import { ctaFinal, marca, rodape } from "@/content/site";
import { Botao, Marca } from "@/components/ui";
import { Entrar, Revelar } from "@/components/movimento";

const secao = "mx-auto w-full max-w-[1280px] px-5 sm:px-8 lg:px-14";

export function CtaFinal() {
  return (
    <section id="contato" className={`${secao} pb-14 lg:pb-26`}>
      <Entrar className="rounded-card bg-acc p-8 text-white lg:p-20">
        <h2 className="max-w-[14ch] text-h2">
          <Revelar>{ctaFinal.titulo}</Revelar>
        </h2>
        <p className="mt-5 max-w-[42ch] text-lead text-white/80">
          {ctaFinal.textoAntes}
          {ctaFinal.prazo}
          {ctaFinal.textoDepois}
        </p>
        <div className="mt-7 flex flex-wrap gap-3 lg:mt-11">
          <Botao href={ctaFinal.acao.href} variante="claro" grande>
            {ctaFinal.acao.texto}
          </Botao>
        </div>
      </Entrar>
    </section>
  );
}

export function Rodape() {
  return (
    <footer className="bg-dark text-white">
      <div className={`${secao} pt-12 pb-8 lg:pt-20 lg:pb-12`}>
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-[1.4fr_0.6fr_0.6fr_0.8fr] lg:gap-10">
          <div>
            <Marca escuro />
            <p className="mt-4 max-w-[30ch] text-[15px] leading-[1.55] text-n2">
              {rodape.frase}
            </p>
          </div>

          {rodape.colunas.map((coluna) => (
            <div key={coluna.titulo}>
              <p className="text-xs uppercase tracking-[0.16em] text-n1">
                {coluna.titulo}
              </p>
              <div className="mt-3">
                {coluna.links.map((l) => (
                  <Link
                    key={`${coluna.titulo}-${l.texto}`}
                    href={l.href}
                    className="block py-1.5 text-[15px] text-n2 transition-colors duration-200 ease-out-soft hover:text-white"
                  >
                    {l.texto}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-n1">Contato</p>
            <div className="mt-3 flex flex-col items-start gap-2.5">
              <span className="text-[15px] text-n2">{marca.email}</span>
              <span className="text-[15px] text-n2">{marca.telefone}</span>
              <span className="text-[15px] text-n2">{marca.cidade}</span>
            </div>
          </div>
        </div>

        <hr className="my-9 border-0 border-t border-[#242424] lg:my-14" />

        <div className="flex flex-wrap justify-between gap-3 text-[13px] text-n1">
          <span>
            © {rodape.ano} {marca.dominio}
          </span>
        </div>
      </div>
    </footer>
  );
}
