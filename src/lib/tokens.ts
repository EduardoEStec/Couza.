/**
 * Paleta aprovada no quadro "Tokens" do canvas.
 *
 * ESPELHA o bloco @theme de src/app/globals.css. CSS nao importa TypeScript,
 * entao os valores existem nos dois lugares — mudar um obriga a mudar o
 * outro. Aqui e a fonte para o que e JavaScript: os e-mails.
 */
export const cor = {
  bg: "#ffffff",
  ink: "#191919",
  dark: "#080808",
  n1: "#737373",
  n2: "#a3a3a3",
  acc: "#4f2bff",
  accHover: "#4123d1",
  accSoft: "#edeaff",
  line: "#eaeaea",
  wash: "#f5f5f5",
  danger: "#e0301f",
  dangerWash: "#fdecea",
} as const;

/**
 * Config do <Tailwind> do React Email. `pixelBasedPreset` e obrigatorio:
 * o padrao do Tailwind e rem, que varios clientes de e-mail ignoram.
 */
export const temaEmail = {
  theme: {
    extend: {
      colors: {
        ink: cor.ink,
        dark: cor.dark,
        n1: cor.n1,
        n2: cor.n2,
        acc: cor.acc,
        "acc-soft": cor.accSoft,
        line: cor.line,
        wash: cor.wash,
      },
    },
  },
} as const;
