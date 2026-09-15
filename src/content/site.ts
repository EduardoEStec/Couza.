/**
 * Todo o texto visivel da landing mora aqui.
 *
 * REGRAS:
 * - Tudo neste arquivo e RASCUNHO aprovado no mockup, nao texto final.
 * - Fato que o Guilherme ainda nao passou NAO se inventa: fica como `falta("...")`
 *   e aparece na tela como uma caixinha tracejada, igual ao mockup.
 * - Para listar o que ainda falta preencher:  grep -rn "falta(" src/
 */

/** Marca um dado que ainda nao existe. Renderizado por <Falta/>. */
export type Falta = { readonly __falta: string };
export const falta = (oQue: string): Falta => ({ __falta: oQue });
export const ehFalta = (v: unknown): v is Falta =>
  typeof v === "object" && v !== null && "__falta" in v;

/**
 * ===================================================================
 *  GUILHERME: seus dados vao AQUI. Troque o `falta(...)` pelo valor.
 *
 *  antes:   email: falta("e-mail"),
 *  depois:  email: "contato@courte.com.br",
 *
 *  O que ainda esta como falta() aparece no site como caixinha
 *  tracejada — nada quebra se voce preencher um de cada vez.
 *
 *  Sobre o CPF: ele e impresso no recibo, entao o cliente ve de
 *  qualquer jeito. O repositorio e privado, entao aqui esta ok. Se um
 *  dia ele virar publico, mova o CPF para variavel de ambiente.
 * ===================================================================
 */
export const marca = {
  nome: "courte",
  dominio: "courte.com.br",
  pessoa: "Guilherme Courte",
  cpf: falta("CPF"),
  email: falta("e-mail"),
  telefone: falta("telefone / whatsapp"),
  cidade: falta("cidade / UF"),
};

export const nav = {
  links: [
    { texto: "Serviços", href: "#servicos" },
    { texto: "Como funciona", href: "#como-funciona" },
    { texto: "Trabalhos", href: "#trabalhos" },
    { texto: "Dúvidas", href: "#duvidas" },
  ],
  portal: { texto: "Portal do Cliente", href: "/portal/login" },
};

export const hero = {
  sobretitulo: "Desenvolvimento web sob medida",
  titulo: ["Sites e sistemas", "sob medida."],
  texto:
    "Eu desenvolvo, publico e mantenho. Você acompanha tudo — o que contratou, o que vence e o que já pagou — no portal do cliente, sem precisar me perguntar.",
  acaoPrincipal: { texto: "Pedir orçamento", href: "#contato" },
  acaoSecundaria: { texto: "Ver trabalhos", href: "#trabalhos" },
  destaque: {
    etiqueta: "Projeto em destaque",
    imagem: falta("imagem do projeto"),
    nome: falta("nome do projeto"),
  },
};

export const servicos = {
  sobretitulo: "Serviços",
  titulo: "O que eu faço, sem enrolação.",
  itens: [
    {
      icone: "tela" as const,
      titulo: "Sites e landing pages",
      texto:
        "Uma página que apresenta o seu negócio e transforma visita em contato. Layout, texto e publicação.",
      pontos: [
        "Layout feito do zero",
        "Certo no celular primeiro",
        "Domínio e publicação",
      ],
    },
    {
      icone: "camadas" as const,
      titulo: "Sistemas sob medida",
      texto:
        "Quando a planilha não dá mais conta e o sistema de prateleira não serve, eu construo o que o seu processo pede.",
      pontos: [
        "Cadastros e relatórios",
        "Integração com outros serviços",
        "Acesso por usuário",
      ],
    },
    {
      icone: "ciclo" as const,
      titulo: "Manutenção e evolução",
      texto:
        "Mensalidade que cobre hospedagem, ajustes e melhorias — para o site não virar um problema seis meses depois.",
      pontos: [
        "Correções e ajustes",
        "Hospedagem monitorada",
        "Suporte direto comigo",
      ],
    },
  ],
};

export const comoFunciona = {
  sobretitulo: "Como funciona",
  titulo: "Quatro passos, do primeiro contato ao pagamento.",
  passos: [
    {
      numero: "01",
      titulo: "Conversa",
      texto:
        "Você me conta o problema. Eu digo o que dá para fazer — e o que não vale a pena fazer.",
    },
    {
      numero: "02",
      titulo: "Proposta",
      texto:
        "Escopo, prazo e valor por escrito, antes de qualquer linha de código.",
    },
    {
      numero: "03",
      titulo: "Construção",
      texto: "Você acompanha o andamento e revisa antes de o site ir para o ar.",
    },
    {
      numero: "04",
      titulo: "Portal",
      texto:
        "Depois de publicado, tudo fica no portal: produtos, faturas e pagamento.",
    },
  ],
};

export const trabalhos = {
  sobretitulo: "Trabalhos",
  titulo: "Alguns projetos.",
  aviso: falta("a preencher com projetos reais"),
  /** Placeholders ate o Guilherme escolher os projetos. Nenhum case inventado. */
  itens: [
    { imagem: falta("imagem do projeto"), nome: falta("nome do projeto"), tipo: falta("tipo de projeto") },
    { imagem: falta("imagem do projeto"), nome: falta("nome do projeto"), tipo: falta("tipo de projeto") },
    { imagem: falta("imagem do projeto"), nome: falta("nome do projeto"), tipo: falta("tipo de projeto") },
  ],
};

/**
 * A resposta e uma lista de pedacos: string = texto, falta() = caixinha.
 * Assim um dado que falta pode aparecer no MEIO da frase.
 *
 * GUILHERME: estes textos sao rascunho meu, escritos a seu pedido.
 * Reescreva a vontade — e a sua voz que tem que sair daqui, nao a minha.
 */
export const duvidas = {
  sobretitulo: "Dúvidas",
  titulo: "Perguntas que sempre chegam.",
  itens: [
    {
      pergunta: "Como funciona a cobrança?",
      resposta: [
        "Projeto fechado tem o valor combinado na proposta, antes de começar. Manutenção é mensalidade. Tudo aparece no portal, com vencimento todo dia ",
        falta("dia do vencimento"),
        ". O aviso de cobrança também chega por e-mail.",
      ],
    },
    {
      pergunta: "Quais formas de pagamento?",
      resposta: [
        "Cartão, Pix ou boleto, direto no portal. O Pix cai em segundos e a fatura muda para paga sozinha — você não precisa mandar comprovante. Boleto leva alguns dias úteis para compensar, então se estiver em cima do vencimento, prefira Pix.",
      ],
    },
    {
      pergunta: "Você emite nota fiscal?",
      resposta: [
        "Não. Presto serviço como pessoa física, então emito recibo. Ele fica no portal assim que o pagamento é confirmado, e você pode imprimir ou salvar em PDF na hora que quiser.",
      ],
    },
    {
      pergunta: "Em quanto tempo fica pronto?",
      resposta: [
        "Depende do tamanho do projeto. O prazo vai por escrito na proposta, antes de começar — e eu não fecho prazo que não consigo cumprir. Para você ter uma ideia: ",
        falta("faixa de prazo típica"),
        ".",
      ],
    },
    {
      pergunta: "E se eu já tiver um site?",
      resposta: [
        "Dá para assumir a manutenção do que já existe ou refazer do zero. Eu olho o que você tem e digo qual dos dois faz mais sentido — inclusive se a resposta for deixar como está.",
      ],
    },
  ],
};

export const ctaFinal = {
  titulo: "Tem um projeto? Me conte.",
  textoAntes: "Resposta em ",
  prazo: falta("prazo de resposta"),
  textoDepois: ". Sem formulário de dez campos: me diga o que você precisa.",
  acao: { texto: "Falar comigo", href: "#contato" },
};

export const rodape = {
  frase: "Sites e sistemas sob medida, feitos e mantidos por uma pessoa só.",
  colunas: [
    {
      titulo: "Serviços",
      links: [
        { texto: "Sites", href: "#servicos" },
        { texto: "Sistemas", href: "#servicos" },
        { texto: "Manutenção", href: "#servicos" },
      ],
    },
    {
      titulo: "Portal",
      links: [
        { texto: "Entrar", href: "/portal/login" },
        { texto: "Primeiro acesso", href: "/portal/primeiro-acesso" },
        { texto: "Faturas", href: "/portal/faturas" },
      ],
    },
  ],
  ano: 2026,
};
