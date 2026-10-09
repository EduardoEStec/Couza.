import Link from "next/link";
import {
  comoFunciona,
  hero,
  quemSomos,
  servicos,
  trabalhos,
} from "@/content/site";
import {
  Botao,
  Check,
  icones,
  Seta,
  SetaDiagonal,
  Sobretitulo,
  Texto,
} from "@/components/ui";
import { Entrar, Revelar } from "@/components/movimento";
import { PortalDemo } from "@/components/landing/portal-demo";
import { ProjetosEsteira } from "@/components/landing/projetos-esteira";

const secao = "mx-auto w-full max-w-[1280px] px-5 sm:px-8 lg:px-14";

/* ------------------------------------------------------------------ */

export function Hero() {
  return (
    <section className={`${secao} pt-10 pb-14 lg:pt-18 lg:pb-30`}>
      <Sobretitulo>{hero.sobretitulo}</Sobretitulo>

      <h1 className="mt-5 max-w-[14ch] text-hero lg:mt-8">
        <Revelar>{hero.titulo[0]}</Revelar>
        <br />
        <Revelar className="text-acc" atraso={0.12}>
          {hero.titulo[1]}
        </Revelar>
      </h1>

      <div className="mt-7 grid gap-6 lg:mt-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:gap-14">
        <Entrar atraso={0.2}>
          <p className="max-w-[46ch] text-lead text-n1">{hero.texto}</p>
        </Entrar>
        <Entrar atraso={0.28} className="flex flex-wrap gap-3">
          <Botao href={hero.acaoPrincipal.href} grande>
            {hero.acaoPrincipal.texto}
            <Seta />
          </Botao>
          <Botao href={hero.acaoSecundaria.href} variante="contorno" grande>
            {hero.acaoSecundaria.texto}
          </Botao>
        </Entrar>
      </div>

      <Entrar atraso={0.36}>
        <div
          className="relative mt-8 flex min-h-70 flex-col justify-between gap-10 overflow-hidden rounded-card bg-acc bg-cover bg-center p-6 text-white lg:mt-14 lg:min-h-105 lg:p-10"
          style={{ backgroundImage: `url(${hero.destaque.imagem})` }}
        >
          {/* escurece o pe da imagem para o nome do projeto ficar legivel */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="relative flex items-start justify-between gap-4">
            <span className="inline-flex h-8 items-center gap-1.5 rounded-pill bg-dark px-3.5 text-white shadow-[0_4px_14px_rgba(0,0,0,0.18)] text-[13px] font-medium">
              <span className="h-[7px] w-[7px] rounded-pill bg-current" />
              {hero.destaque.etiqueta}
            </span>
            <span className="flex h-10 w-10 items-center justify-center rounded-pill bg-dark text-white shadow-[0_4px_14px_rgba(0,0,0,0.18)]">
              <SetaDiagonal tamanho={22} />
            </span>
          </div>
          <div className="relative">
            <p className="text-[26px] font-medium leading-[1.1] tracking-[-0.035em] lg:text-[44px]">
              <Texto v={hero.destaque.nome} tom="escuro" />
            </p>
          </div>
        </div>
      </Entrar>
    </section>
  );
}

/* ------------------------------------------------------------------ */

export function Servicos() {
  return (
    <section id="servicos" className={`${secao} py-14 lg:py-30`}>
      <Sobretitulo>{servicos.sobretitulo}</Sobretitulo>
      <h2 className="mt-4 max-w-[18ch] text-h2">
        <Revelar>{servicos.titulo}</Revelar>
      </h2>

      <div className="mt-7 grid gap-4 lg:mt-12 lg:grid-cols-3 lg:gap-6">
        {servicos.itens.map((item, i) => {
          const Icone = icones[item.icone];
          return (
            <Entrar
              key={item.titulo}
              atraso={i * 0.08}
              className="rounded-card border border-line bg-white p-[22px] transition-[transform,box-shadow,border-color] duration-200 ease-out-soft hover:-translate-y-1.5 hover:border-[#dcdcdc] hover:shadow-[0_18px_40px_rgba(25,25,25,0.10)] lg:p-8"
            >
              <Icone className="text-acc" />
              <h3 className="mt-5 text-h3">{item.titulo}</h3>
              <p className="mt-3 text-sm leading-[1.55] text-n1">{item.texto}</p>
              <ul className="mt-5 flex flex-col gap-2.5">
                {item.pontos.map((p) => (
                  <li key={p} className="flex items-center gap-2.5 text-sm">
                    <Check className="shrink-0 text-acc" />
                    {p}
                  </li>
                ))}
              </ul>
            </Entrar>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

export function ComoFunciona() {
  return (
    <section id="como-funciona" className={`${secao} py-14 lg:py-30`}>
      <Sobretitulo>{comoFunciona.sobretitulo}</Sobretitulo>
      <h2 className="mt-4 text-h2">
        <Revelar>{comoFunciona.titulo[0]}</Revelar>
        <br />
        <Revelar atraso={0.12}>{comoFunciona.titulo[1]}</Revelar>
      </h2>

      <div className="mt-7 grid gap-4 lg:mt-12 lg:grid-cols-4 lg:gap-6">
        {comoFunciona.passos.map((p, i) => (
          <Entrar
            key={p.numero}
            atraso={i * 0.08}
            className="rounded-card bg-wash p-[22px] lg:p-8"
          >
            <span className="text-[40px] font-medium leading-none tracking-[-0.04em] text-acc lg:text-[56px]">
              {p.numero}
            </span>
            <h3 className="mt-4.5 text-xl font-medium tracking-[-0.03em]">
              {p.titulo}
            </h3>
            <p className="mt-2.5 text-sm leading-[1.55] text-n1">{p.texto}</p>
          </Entrar>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

/** Demo do portal ("Experimente"), logo depois de Trabalhos. */
export function Experimente() {
  return (
    <section id="experimente" className={`${secao} pb-14 lg:pb-30`}>
      <PortalDemo />
    </section>
  );
}

/* ------------------------------------------------------------------ */

export function Trabalhos() {
  const cartoes = trabalhos.itens.map((item, i) => {
    const conteudo = (
      <>
        {item.foto ? (
          // Moldura fixa; no hover a imagem aproxima de leve dentro dela.
          <div
            className="relative aspect-[16/10] w-full overflow-hidden rounded-[20px] border border-line bg-white"
            // Logo com fundo proprio (ex.: Romaneio): a moldura pega a mesma cor.
            style={item.fundo ? { backgroundColor: item.fundo } : undefined}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- PNG estatico; next/image nao otimiza no Worker */}
            <img
              src={item.foto}
              alt={item.imagem}
              loading="lazy"
              className={`absolute inset-0 h-full w-full transition-transform duration-700 ease-out-soft group-hover:scale-[1.04] ${
                item.inteira ? "object-contain p-6" : "object-cover object-left-top"
              }`}
            />
          </div>
        ) : (
          <div className="flex aspect-[16/10] w-full items-center justify-center rounded-[20px] border border-dashed border-n2 bg-wash text-sm text-n1">
            <Texto v={item.imagem} />
          </div>
        )}
        <div className="mt-5 flex items-center justify-between gap-3">
          <h3 className="text-xl font-medium tracking-[-0.03em]">
            <Texto v={item.nome} />
          </h3>
          <SetaDiagonal className="text-n2 transition-colors duration-200 ease-out-soft group-hover:text-acc" />
        </div>
        <p className="mt-2.5 text-sm text-n1">
          <Texto v={item.tipo} />
        </p>
      </>
    );
    return (
      <Entrar
        key={i}
        atraso={i * 0.08}
        className="group flex w-full flex-col rounded-card border border-line bg-white p-[22px] transition-[transform,box-shadow,border-color] duration-200 ease-out-soft hover:-translate-y-1.5 hover:border-[#dcdcdc] hover:shadow-[0_18px_40px_rgba(25,25,25,0.10)] lg:p-8"
      >
        {item.href ? (
          <Link href={item.href} className="flex min-h-0 flex-1 flex-col">
            {conteudo}
          </Link>
        ) : (
          conteudo
        )}
      </Entrar>
    );
  });

  return (
    <ProjetosEsteira
      id="trabalhos"
      cartoes={cartoes}
      cabecalho={
        <div>
          <Sobretitulo>{trabalhos.sobretitulo}</Sobretitulo>
          <h2 className="mt-4 max-w-[16ch] text-h2">
            <Revelar>{trabalhos.titulo}</Revelar>
          </h2>
        </div>
      }
    />
  );
}

/* ------------------------------------------------------------------ */

export function QuemSomos() {
  return (
    <section id="quem-somos" className={`${secao} py-14 lg:py-30`}>
      <Sobretitulo>{quemSomos.sobretitulo}</Sobretitulo>
      <h2 className="mt-4 max-w-[18ch] text-h2">
        <Revelar>{quemSomos.titulo}</Revelar>
      </h2>

      <div className="mt-7 flex flex-wrap justify-center gap-4 lg:mt-12 lg:gap-6">
        {quemSomos.pessoas.map((p, i) => (
          <Entrar
            key={i}
            atraso={i * 0.08}
            className="w-full rounded-card bg-wash p-[22px] sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-3rem)/3)] lg:p-8"
          >
            <div className="flex aspect-square items-center justify-center rounded-[20px] border border-dashed border-n2 bg-white text-sm text-n1">
              <Texto v={p.foto} />
            </div>
            <h3 className="mt-5 text-xl font-medium tracking-[-0.03em]">
              <Texto v={p.nome} />
            </h3>
            <p className="mt-1.5 text-sm font-medium text-acc">
              <Texto v={p.funcao} />
            </p>
            <p className="mt-3 text-sm leading-[1.55] text-n1">
              <Texto v={p.bio} />
            </p>
          </Entrar>
        ))}
      </div>
    </section>
  );
}
