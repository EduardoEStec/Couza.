import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ehFalta, type Falta as TFalta } from "@/content/site";

/* ------------------------------------------------------------------ *
 * Dado que ainda falta
 * ------------------------------------------------------------------ */

/**
 * Caixinha tracejada do mockup: marca um dado que o Guilherme ainda nao
 * passou. Nunca substituir por valor inventado.
 */
export function Falta({
  o,
  tom = "claro",
}: {
  o: TFalta | string;
  tom?: "claro" | "escuro";
}) {
  const texto = typeof o === "string" ? o : o.__falta;
  return (
    <span
      className={
        tom === "escuro"
          ? "inline-block rounded-md border border-dashed border-white/30 bg-white/8 px-1.5 text-[0.92em] leading-snug text-n2"
          : "inline-block rounded-md border border-dashed border-n2 bg-wash px-1.5 text-[0.92em] leading-snug text-n1"
      }
    >
      {texto}
    </span>
  );
}

/** Renderiza texto normal ou a caixinha, conforme o conteudo. */
export function Texto({ v, tom }: { v: TFalta | string; tom?: "claro" | "escuro" }) {
  return ehFalta(v) ? <Falta o={v} tom={tom} /> : <>{v}</>;
}

/* ------------------------------------------------------------------ *
 * Marca
 * ------------------------------------------------------------------ */

export function Marca({ escuro = false }: { escuro?: boolean }) {
  return (
    <span
      className={`inline-flex items-baseline text-[22px] font-semibold tracking-[-0.04em] ${
        escuro ? "text-white" : "text-ink"
      }`}
    >
      couza<span className="text-acc">.</span>
    </span>
  );
}

export function Sobretitulo({ children }: { children: ReactNode }) {
  return (
    <p className="text-[13px] font-medium uppercase tracking-[0.16em] text-n1">
      {children}
    </p>
  );
}

/* ------------------------------------------------------------------ *
 * Botao — estados do quadro "Movimento":
 * fundo 200ms ease-out-soft, seta desliza 4px, ao pressionar scale .975 em 120ms
 * ------------------------------------------------------------------ */

type Variante = "primario" | "contorno" | "claro" | "contorno-claro";

const variantes: Record<Variante, string> = {
  primario: "bg-acc text-white border-acc hover:bg-acc-hover hover:border-acc-hover",
  contorno:
    "bg-transparent text-ink border-line hover:bg-wash hover:border-n2",
  claro: "bg-white text-acc border-white hover:bg-acc-soft hover:text-acc-hover",
  "contorno-claro":
    "bg-transparent text-white border-white/40 hover:border-white hover:bg-white/10",
};

export function Botao({
  href,
  variante = "primario",
  grande = false,
  bloco = false,
  className = "",
  children,
  ...resto
}: {
  href?: string;
  variante?: Variante;
  grande?: boolean;
  bloco?: boolean;
  children: ReactNode;
} & Omit<ComponentProps<"button">, "ref">) {
  const classe = [
    "group inline-flex items-center justify-center gap-2.5 rounded-btn border font-medium",
    "transition-[background-color,border-color,color,transform] duration-200 ease-out-soft",
    "active:scale-[0.975] active:duration-[120ms]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acc",
    grande ? "min-h-14 px-[30px] text-[17px]" : "min-h-12 px-[22px] text-base",
    bloco ? "w-full" : "",
    variantes[variante],
    className,
  ].join(" ");

  if (href) {
    return (
      <Link href={href} className={classe}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classe} {...resto}>
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ *
 * Icones — traco de 1.5/2, grade de 24, sem emoji
 * ------------------------------------------------------------------ */

type IconeProps = { className?: string; tamanho?: number };

const svg = (tamanho: number, className: string, largura: number) => ({
  width: tamanho,
  height: tamanho,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: largura,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className,
  "aria-hidden": true,
});

export function Seta({ className = "", tamanho = 18 }: IconeProps) {
  return (
    <svg {...svg(tamanho, `${className} transition-transform duration-200 ease-out-soft group-hover:translate-x-1`, 1.8)}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function Check({ className = "", tamanho = 16 }: IconeProps) {
  return (
    <svg {...svg(tamanho, className, 2)}>
      <path d="M4 12.5 9.5 18 20 6.5" />
    </svg>
  );
}

export function SetaDiagonal({ className = "", tamanho = 22 }: IconeProps) {
  return (
    <svg {...svg(tamanho, className, 1.6)}>
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

export function Menu({ className = "", tamanho = 20 }: IconeProps) {
  return (
    <svg {...svg(tamanho, className, 1.6)}>
      <path d="M3 7h18M3 12h18M3 17h18" />
    </svg>
  );
}

export function Tela({ className = "", tamanho = 30 }: IconeProps) {
  return (
    <svg {...svg(tamanho, className, 1.5)}>
      <rect x="2.5" y="4" width="19" height="13.5" rx="2.5" />
      <path d="M2.5 8.5h19M9 21h6" />
    </svg>
  );
}

export function Camadas({ className = "", tamanho = 30 }: IconeProps) {
  return (
    <svg {...svg(tamanho, className, 1.5)}>
      <path d="M3.5 7.5 12 3l8.5 4.5-8.5 4.5z" />
      <path d="M3.5 12 12 16.5 20.5 12M3.5 16.5 12 21l8.5-4.5" />
    </svg>
  );
}

export function Ciclo({ className = "", tamanho = 30 }: IconeProps) {
  return (
    <svg {...svg(tamanho, className, 1.5)}>
      <path d="M20 12a8 8 0 1 1-2.4-5.7" />
      <path d="M20 4v4h-4" />
    </svg>
  );
}

export const icones = { tela: Tela, camadas: Camadas, ciclo: Ciclo };

/* ------------------------------------------------------------------ *
 * Pilula de status — cores do quadro "Tokens"
 * ------------------------------------------------------------------ */

type TomPilula = "acc" | "neutra" | "perigo" | "escura";

const tons: Record<TomPilula, string> = {
  acc: "bg-acc-soft text-acc",
  neutra: "bg-wash text-n1",
  perigo: "bg-danger-wash text-danger",
  escura: "bg-dark text-white",
};

export function Pilula({
  tom = "neutra",
  ponto = false,
  className = "",
  children,
}: {
  tom?: TomPilula;
  ponto?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex h-8 items-center gap-[7px] rounded-pill px-3.5 text-[13px] font-medium leading-none whitespace-nowrap ${tons[tom]} ${className}`}
    >
      {ponto && <span className="h-[7px] w-[7px] shrink-0 rounded-pill bg-current" />}
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Icones do portal
 * ------------------------------------------------------------------ */

export function Usuario({ className = "", tamanho = 20 }: IconeProps) {
  return (
    <svg {...svg(tamanho, className, 1.6)}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}

export function Caixa({ className = "", tamanho = 17 }: IconeProps) {
  return (
    <svg {...svg(tamanho, className, 1.6)}>
      <path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z" />
      <path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" />
    </svg>
  );
}

export function Nota({ className = "", tamanho = 17 }: IconeProps) {
  return (
    <svg {...svg(tamanho, className, 1.6)}>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
      <path d="M9.5 8.5h5M9.5 12.5h5" />
    </svg>
  );
}

export function SetaEsquerda({ className = "", tamanho = 16 }: IconeProps) {
  return (
    <svg {...svg(tamanho, className, 1.8)}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

export function Envelope({ className = "", tamanho = 30 }: IconeProps) {
  return (
    <svg {...svg(tamanho, className, 1.5)}>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </svg>
  );
}

export function Olho({ className = "", tamanho = 20 }: IconeProps) {
  return (
    <svg {...svg(tamanho, className, 1.6)}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function Relogio({ className = "", tamanho = 20 }: IconeProps) {
  return (
    <svg {...svg(tamanho, className, 1.6)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5l3 2" />
    </svg>
  );
}

export function Alerta({ className = "", tamanho = 13 }: IconeProps) {
  return (
    <svg {...svg(tamanho, className, 2)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6M12 16.5v.5" />
    </svg>
  );
}

export function Info({ className = "", tamanho = 18 }: IconeProps) {
  return (
    <svg {...svg(tamanho, className, 1.6)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.5v.5" />
    </svg>
  );
}

export function Escudo({ className = "", tamanho = 18 }: IconeProps) {
  return (
    <svg {...svg(tamanho, className, 1.6)}>
      <path d="M12 3.5 5 6.5v5c0 4.3 2.9 7.6 7 9 4.1-1.4 7-4.7 7-9v-5z" />
      <path d="m9.2 12 2 2 3.6-3.6" />
    </svg>
  );
}

export function Cadeado({ className = "", tamanho = 14 }: IconeProps) {
  return (
    <svg {...svg(tamanho, className, 1.7)}>
      <rect x="4.5" y="10.5" width="15" height="9.5" rx="2.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function Cartao({ className = "", tamanho = 18 }: IconeProps) {
  return (
    <svg {...svg(tamanho, className, 1.6)}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" />
      <path d="M2.5 10h19" />
    </svg>
  );
}

export function QrCode({ className = "", tamanho = 18 }: IconeProps) {
  return (
    <svg {...svg(tamanho, className, 1.6)}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <path d="M14 14h3v3h-3zM19.5 19.5h1" />
    </svg>
  );
}

export function Barras({ className = "", tamanho = 18 }: IconeProps) {
  return (
    <svg {...svg(tamanho, className, 1.6)}>
      <path d="M4 6v12M7.5 6v12M11 6v12M14.5 6v12M18 6v12M20.5 6v12" />
    </svg>
  );
}

export function Copiar({ className = "", tamanho = 18 }: IconeProps) {
  return (
    <svg {...svg(tamanho, className, 1.7)}>
      <rect x="8.5" y="8.5" width="12" height="12" rx="2.5" />
      <path d="M15.5 5.5h-9a2 2 0 0 0-2 2v9" />
    </svg>
  );
}

export function Baixar({ className = "", tamanho = 17 }: IconeProps) {
  return (
    <svg {...svg(tamanho, className, 1.7)}>
      <path d="M12 4v11M7.5 11 12 15.5 16.5 11M5 19.5h14" />
    </svg>
  );
}

export function Imprimir({ className = "", tamanho = 18 }: IconeProps) {
  return (
    <svg {...svg(tamanho, className, 1.7)}>
      <path d="M6.5 9V3.5h11V9" />
      <rect x="3.5" y="9" width="17" height="7" rx="2" />
      <path d="M6.5 14h11v6.5h-11z" />
    </svg>
  );
}

export function Fechar({ className = "", tamanho = 20 }: IconeProps) {
  return (
    <svg {...svg(tamanho, className, 1.8)}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function Chevron({ className = "", tamanho = 18 }: IconeProps) {
  return (
    <svg {...svg(tamanho, className, 1.8)}>
      <path d="m6 9.5 6 6 6-6" />
    </svg>
  );
}
