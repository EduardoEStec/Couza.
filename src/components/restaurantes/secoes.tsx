import { restCaso, restFuncoes, restHero, restTelas } from "@/content/restaurantes";
import { Botao, Check, Seta, Sobretitulo } from "@/components/ui";
import { Entrar, Revelar } from "@/components/movimento";

const secao = "mx-auto w-full max-w-[1280px] px-5 sm:px-8 lg:px-14";

// Capturas do sistema: PNG estatico; next/image nao otimiza no Worker (ver open-next.config.ts).
/* eslint-disable @next/next/no-img-element */

/* ------------------------------------------------------------------ */

export function HeroRestaurantes() {
  return (
    <section className={`${secao} pt-10 pb-14 lg:pt-18 lg:pb-30`}>
      <h1 className="text-h2">
        <Revelar>{restHero.nome}</Revelar>
      </h1>
      <Entrar atraso={0.12}>
        <p className="mt-4 text-h3 text-acc lg:mt-6">{restHero.subtitulo}</p>
      </Entrar>

      <div className="mt-7 grid gap-6 lg:mt-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:gap-14">
        <Entrar atraso={0.2}>
          <p className="max-w-[46ch] text-lead text-n1">{restHero.texto}</p>
        </Entrar>
        <Entrar atraso={0.28} className="flex flex-wrap gap-3">
          <Botao href={restHero.acaoPrincipal.href} grande novaAba>
            {restHero.acaoPrincipal.texto}
            <Seta />
          </Botao>
          <Botao href={restHero.acaoSecundaria.href} variante="contorno" grande>
            {restHero.acaoSecundaria.texto}
          </Botao>
        </Entrar>
      </div>

      <Entrar atraso={0.36}>
        <img
          src={restHero.imagem.src}
          alt={restHero.imagem.alt}
          className="mt-8 w-full rounded-card border border-line lg:mt-14"
        />
      </Entrar>
    </section>
  );
}

/* ------------------------------------------------------------------ */

export function Funcoes() {
  return (
    <section id="funcoes" className={`${secao} py-14 lg:py-30`}>
      <Sobretitulo>{restFuncoes.sobretitulo}</Sobretitulo>
      <h2 className="mt-4 max-w-[18ch] text-h2">
        <Revelar>{restFuncoes.titulo}</Revelar>
      </h2>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4 lg:gap-6">
        {restFuncoes.itens.map((item, i) => (
          <Entrar
            key={item.titulo}
            atraso={(i % 4) * 0.08}
            className="rounded-card bg-wash p-[22px] lg:p-8"
          >
            <Check className="text-acc" tamanho={22} />
            <h3 className="mt-4 text-xl font-medium tracking-[-0.03em]">{item.titulo}</h3>
            <p className="mt-2.5 text-sm leading-[1.55] text-n1">{item.texto}</p>
          </Entrar>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

export function Telas() {
  return (
    <section id="telas" className={`${secao} py-14 lg:py-30`}>
      <Sobretitulo>{restTelas.sobretitulo}</Sobretitulo>
      <h2 className="mt-4 max-w-[18ch] text-h2">
        <Revelar>{restTelas.titulo}</Revelar>
      </h2>

      <div className="mt-7 grid gap-4 lg:mt-12 lg:grid-cols-[1fr_0.42fr] lg:gap-6">
        <div className="grid gap-4 lg:gap-6">
          {restTelas.itens.map((t, i) => (
            <Entrar key={t.src} atraso={i * 0.08}>
              <figure>
                <img
                  src={t.src}
                  alt={t.alt}
                  loading="lazy"
                  className="aspect-[4/3] w-full rounded-card border border-line object-cover object-left-top"
                />
                <figcaption className="mt-3 text-sm text-n1">{t.legenda}</figcaption>
              </figure>
            </Entrar>
          ))}
        </div>

        <Entrar atraso={0.12} className="lg:sticky lg:top-24 lg:self-start">
          {/* No computador o celular fica preso ao rolar: a largura tambem segue a ALTURA da
              tela (proporcao 390x844 do print + legenda e respiro ~180px), para caber inteiro. */}
          <figure className="mx-auto max-w-[280px] lg:max-w-[min(260px,calc((100svh-180px)*0.46))]">
            <img
              src={restTelas.celular.src}
              alt={restTelas.celular.alt}
              loading="lazy"
              className="w-full rounded-[28px] border-[6px] border-dark"
            />
            <figcaption className="mt-3 text-center text-sm text-n1">
              {restTelas.celular.legenda}
            </figcaption>
          </figure>
        </Entrar>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

export function Caso() {
  return (
    <section className={`${secao} py-14 lg:py-30`}>
      <Entrar className="grid items-center gap-8 rounded-card border border-line p-8 lg:grid-cols-[0.6fr_1fr] lg:gap-14 lg:p-14">
        <img
          src={restCaso.logo.src}
          alt={restCaso.logo.alt}
          loading="lazy"
          className="mx-auto w-full max-w-[320px]"
        />
        <div>
          <Sobretitulo>{restCaso.sobretitulo}</Sobretitulo>
          <h2 className="mt-4 max-w-[16ch] text-h2">
            <Revelar>{restCaso.titulo}</Revelar>
          </h2>
          <p className="mt-5 max-w-[46ch] text-lead text-n1">{restCaso.texto}</p>
        </div>
      </Entrar>
    </section>
  );
}
