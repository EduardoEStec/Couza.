/**
 * Conteudo e estrutura das telas do portal.
 *
 * ATENCAO — nada aqui e dado real nem dado inventado.
 * Enquanto o banco nao existe, cada valor e um `falta(...)`, que a tela
 * desenha como caixinha tracejada. E de proposito: assim ninguem confunde
 * a tela com dado de cliente de verdade, e a tela fica identica ao mockup
 * aprovado. Quando o Drizzle entrar, isto some e vira consulta.
 */

import { falta, type Falta } from "./site";

/* ------------------------------------------------------------------ */

export const navPortal = [
  { texto: "Meus Produtos", href: "/portal/produtos", icone: "caixa" as const },
  { texto: "Faturas", href: "/portal/faturas", icone: "nota" as const },
];

/* --- acesso ------------------------------------------------------- */

export const login = {
  titulo: ["Portal do", "Cliente."],
  apoio: "Entre com o e-mail que você me passou quando fechamos o projeto.",
  campos: { email: "E-mail", senha: "Senha" },
  esqueci: "Esqueci minha senha",
  entrar: "Entrar",
  primeiroAcesso: { antes: "Primeiro acesso?", link: "Criar minha senha" },
  ajuda: "Problema para entrar? Fale comigo em ",
  painel: {
    titulo: "Tudo o que você contratou, num lugar só.",
    itens: [
      "Seus produtos e o que cada um custa por mês",
      "Faturas pagas, em aberto e atrasadas",
      "Pagamento por cartão, Pix ou boleto",
    ],
  },
};

export const primeiroAcesso = {
  titulo: ["Portal do", "Cliente."],
  assunto: "Primeiro acesso",
  apoio:
    "Informe o e-mail que você me passou e eu envio um link para criar a sua senha.",
  campo: "E-mail cadastrado",
  dica: "Precisa ser o mesmo e-mail do seu cadastro. Não tem certeza? Me chame.",
  enviar: "Enviar link de acesso",
  passos: [
    "Você recebe um e-mail com um link único.",
    "Clica no link e escolhe a sua senha.",
    "Entra direto no portal, já logado.",
  ],
  jaTenho: { antes: "Já tem senha?", link: "Entrar" },
};

export const verifiqueEmail = {
  titulo: ["Portal do", "Cliente."],
  assunto: "Verifique seu e-mail",
  apoio: {
    antes: "Enviei um link de acesso para ",
    email: falta("e-mail informado"),
    depois: " — abra e clique nele para criar a sua senha.",
  },
  validade: { antes: "O link vale por ", tempo: falta("tempo de validade"), depois: ". Depois disso é só pedir outro." },
  abrirEmail: "Abrir meu e-mail",
  reenviar: "Reenviar link",
  outroEmail: "Usar outro e-mail",
  spam: { antes: "Não chegou em alguns minutos? Procure na caixa de spam ou me chame em ", email: falta("e-mail de contato") },
};

/* --- meus produtos ------------------------------------------------ */

export type CobrancaAvulsa = {
  descricao: Falta;
  data: Falta;
  valor: Falta;
  estado: "aberta" | "paga";
};

export type Produto = {
  icone: "tela" | "camadas";
  nome: Falta;
  tipo: Falta;
  mensalidade: Falta;
  proximaCobranca: Falta;
  desde: Falta;
  endereco?: Falta;
  avulsas: CobrancaAvulsa[];
};

export const produtos = {
  saudacao: { antes: "Olá, ", nome: falta("nome do cliente") },
  apoio: "Tudo o que está ativo hoje, e o que cada coisa custa.",
  itens: [
    {
      icone: "tela",
      nome: falta("nome do produto"),
      tipo: falta("tipo — site, sistema…"),
      mensalidade: falta("valor"),
      proximaCobranca: falta("dd/mm/aaaa"),
      desde: falta("dd/mm/aaaa"),
      endereco: falta("dominio.com.br"),
      avulsas: [
        { descricao: falta("descrição da cobrança avulsa"), data: falta("dd/mm/aaaa"), valor: falta("valor"), estado: "aberta" },
        { descricao: falta("descrição da cobrança avulsa"), data: falta("dd/mm/aaaa"), valor: falta("valor"), estado: "paga" },
      ],
    },
    {
      icone: "camadas",
      nome: falta("nome do produto"),
      tipo: falta("tipo — site, sistema…"),
      mensalidade: falta("valor"),
      proximaCobranca: falta("dd/mm/aaaa"),
      desde: falta("dd/mm/aaaa"),
      avulsas: [],
    },
  ] satisfies Produto[],
  semAvulsas: "Nenhuma cobrança avulsa por enquanto.",
  orcamento: {
    texto:
      "Precisa de um ajuste, uma página nova ou uma integração? Peça por aqui que eu respondo com prazo e valor.",
    botao: "Pedir um orçamento",
  },
};

/* --- faturas ------------------------------------------------------ */

export type EstadoFatura = "atrasada" | "aberta" | "paga";

export type Fatura = {
  id: string;
  estado: EstadoFatura;
  numero: Falta;
  valor: Falta;
  produto: Falta;
  vencimento: Falta;
  dias: Falta;
  formaPagamento?: Falta;
};

export const faturas = {
  titulo: "Faturas",
  apoio: "O que venceu, o que vence e o que já foi pago.",
  filtros: ["Todas", "Em aberto", "Pagas", "Atrasadas"],
  rodape:
    "Faturas antigas ficam guardadas aqui. Qualquer divergência, me chame antes de pagar.",
  itens: [
    {
      id: "1",
      estado: "atrasada",
      numero: falta("nº"),
      valor: falta("valor"),
      produto: falta("nome do produto"),
      vencimento: falta("dd/mm/aaaa"),
      dias: falta("nº"),
    },
    {
      id: "2",
      estado: "aberta",
      numero: falta("nº"),
      valor: falta("valor"),
      produto: falta("nome do produto"),
      vencimento: falta("dd/mm/aaaa"),
      dias: falta("nº"),
    },
    {
      id: "3",
      estado: "paga",
      numero: falta("nº"),
      valor: falta("valor"),
      produto: falta("nome do produto"),
      vencimento: falta("dd/mm/aaaa"),
      dias: falta("nº"),
      formaPagamento: falta("forma de pagamento"),
    },
  ] satisfies Fatura[],
};

/* --- checkout ----------------------------------------------------- */

export const checkout = {
  seguro: "Pagamento seguro",
  resumo: {
    rotulo: "Você está pagando",
    descricao: falta("descrição da cobrança"),
    valor: falta("valor"),
    vencimento: falta("dd/mm/aaaa"),
  },
  rotuloAbas: "Forma de pagamento",
  abas: [
    { id: "cartao" as const, texto: "Cartão" },
    { id: "pix" as const, texto: "Pix" },
    { id: "boleto" as const, texto: "Boleto" },
  ],
  cartao: {
    numero: { rotulo: "Número do cartão", exemplo: falta("0000 0000 0000 0000") },
    nome: { rotulo: "Nome impresso no cartão", exemplo: falta("como está no cartão") },
    validade: { rotulo: "Validade", exemplo: falta("MM/AA") },
    cvv: { rotulo: "CVV", exemplo: falta("000") },
    cpf: { rotulo: "CPF do titular", exemplo: falta("000.000.000-00") },
    parcelas: { rotulo: "Parcelas", exemplo: falta("à vista / opções de parcelamento"), dica: falta("regra a definir") },
    pagar: "Pagar R$ ",
    seguranca:
      "Os dados do cartão vão direto para o Asaas, que processa a cobrança. Eu não guardo número de cartão no meu servidor.",
  },
  pix: {
    qr: falta("QR gerado pelo Asaas na hora"),
    instrucao: "Abra o app do seu banco, escolha Pix > Pagar com QR Code e aponte a câmera.",
    rotuloCodigo: "Ou copie o código Pix",
    codigo: falta("código copia e cola gerado no momento do pagamento"),
    copiar: "Copiar código",
    aviso:
      "O pagamento cai em segundos e a fatura muda para paga sozinha — você não precisa mandar comprovante.",
    validade: { antes: "Este código expira em ", tempo: falta("tempo de validade") },
  },
  boleto: {
    codigoBarras: falta("código de barras do boleto"),
    rotuloLinha: "Linha digitável",
    linha: falta("00000.00000 00000.000000 00000.000000 0 00000000000000"),
    copiar: "Copiar linha digitável",
    baixar: "Baixar boleto em PDF",
    aviso:
      "Boleto pago leva alguns dias para compensar. Se estiver em cima do vencimento, prefira Pix.",
    compensacao: { antes: "Prazo de compensação: ", prazo: falta("a confirmar") },
  },
};

/* --- recibo ------------------------------------------------------- */

export const recibo = {
  titulo: "Recibo",
  voltar: "Faturas",
  apoio: { antes: "Fatura ", numero: falta("nº"), meio: ", paga em ", data: falta("dd/mm/aaaa"), depois: "." },
  imprimir: "Imprimir ou salvar em PDF",
  dica: {
    antes: "Abre a janela de impressão do navegador. Para guardar o arquivo, escolha ",
    forte: "Salvar como PDF",
    depois: " no lugar da impressora.",
  },
  previa: "Como vai sair impresso",
  documento: {
    rotuloValor: "Valor recebido",
    valor: falta("valor"),
    extenso: falta("valor por extenso"),
    corpo: {
      a: "Recebi de ",
      cliente: falta("nome do cliente"),
      b: ", inscrito sob o CPF/CNPJ ",
      documento: falta("documento do cliente"),
      c: ", a importância acima, referente a ",
      servico: falta("descrição do serviço"),
      d: ", dando plena quitação do valor.",
    },
    linhas: [
      { rotulo: "Fatura", valor: falta("nº") },
      { rotulo: "Produto", valor: falta("nome do produto") },
      { rotulo: "Forma de pagamento", valor: falta("cartão / Pix / boleto") },
      { rotulo: "Data do pagamento", valor: falta("dd/mm/aaaa") },
    ],
    local: { cidade: falta("cidade"), data: falta("dd/mm/aaaa") },
    aviso:
      "Este documento é um recibo de pagamento de serviço prestado por pessoa física. Não é nota fiscal.",
  },
};
