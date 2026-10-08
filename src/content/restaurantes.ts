/**
 * Textos da LP /restaurantes — produto fixo "Couza · Restaurantes".
 *
 * RASCUNHO escrito em 08/10/2026 e aprovado para revisao pelo Eduardo. Tudo
 * aqui descreve o que o sistema da Amorim (C:\Projetos\Amorim\amorim.html)
 * faz DE VERDADE. Nao acrescentar promessa que o sistema nao cumpra.
 *
 * As capturas em public/restaurantes/ usam dados de exemplo (vendas de
 * teste), lancados so num navegador local — nao sao numeros reais da Amorim.
 */

const whatsapp = (texto: string) =>
  `https://wa.me/5511924841502?text=${encodeURIComponent(texto)}`;

const contato = whatsapp("Olá, quero conhecer o sistema para restaurantes.");

export const restNav = [
  { texto: "Funções", href: "#funcoes" },
  { texto: "Telas", href: "#telas" },
  { texto: "Dúvidas", href: "#duvidas" },
];

export const restHero = {
  nome: "Couza · Restaurantes",
  subtitulo: "Sistema para restaurantes",
  texto:
    "Comandas, caixa, estoque e cardápio digital num sistema só. Você vê o que vendeu, quanto lucrou e o que precisa repor — sem planilha e sem papel.",
  acaoPrincipal: { texto: "Quero conhecer", href: contato },
  acaoSecundaria: { texto: "Ver as funções", href: "#funcoes" },
  imagem: { src: "/restaurantes/painel.png", alt: "Painel de vendas do sistema, com faturamento, lucro e ranking dos produtos" },
};

export const restFuncoes = {
  sobretitulo: "Funções",
  titulo: "Tudo o que o salão e o caixa precisam.",
  itens: [
    {
      titulo: "Comandas por mesa e balcão",
      texto: "Abra a mesa, lance os pedidos e feche a conta em Dinheiro, Pix, crédito ou débito.",
    },
    {
      titulo: "Painel de vendas",
      texto: "Faturamento, lucro, margem, ticket médio e os produtos que mais vendem, dia a dia.",
    },
    {
      titulo: "Estoque que baixa sozinho",
      texto: "Cada venda desconta do estoque. O sistema avisa o que está abaixo do mínimo.",
    },
    {
      titulo: "Caixa e sangria",
      texto: "Abertura com troco, sangria e suprimento. Você sabe quanto deve ter na gaveta.",
    },
    {
      titulo: "Compras",
      texto: "Registre o que comprou. Compra ligada a um produto já entra no estoque.",
    },
    {
      titulo: "Cardápio digital",
      texto: "Seu cardápio no celular do cliente, separado por categoria, com preço e foto.",
    },
    {
      titulo: "Com a sua marca",
      texto: "Logo, cores e fonte do seu restaurante, e o número de mesas da sua casa.",
    },
    {
      titulo: "Equipe com acesso certo",
      texto: "Garçons usam as comandas. Cardápio, marca e equipe ficam só com o administrador.",
    },
  ],
};

export const restTelas = {
  sobretitulo: "Telas",
  titulo: "Feito para usar na correria.",
  itens: [
    { src: "/restaurantes/comandas.png", alt: "Tela de comandas com as mesas abertas e livres", legenda: "Mesas abertas e livres num relance." },
    { src: "/restaurantes/estoque.png", alt: "Tela de estoque com aviso de produto para repor", legenda: "Aviso de reposição antes de faltar." },
    { src: "/restaurantes/caixa.png", alt: "Tela de caixa com o valor esperado na gaveta", legenda: "Conta do caixa feita pelo sistema." },
  ],
  celular: { src: "/restaurantes/cardapio.png", alt: "Cardápio digital aberto no celular", legenda: "Cardápio digital no celular do cliente." },
};

export const restCaso = {
  sobretitulo: "Projeto real",
  titulo: "Nasceu na Amorim Espetaria.",
  texto:
    "O sistema foi desenvolvido para a Amorim Espetaria e virou produto da Couza. Cada restaurante recebe o sistema com a própria marca.",
  logo: { src: "/projetos/amorim-logo.jpg", alt: "Logo da Amorim Espetaria" },
};

export const restDuvidas = {
  sobretitulo: "Dúvidas",
  titulo: "Perguntas que sempre chegam.",
  itens: [
    {
      pergunta: "Quanto custa?",
      resposta: [
        "Depende do tamanho da sua casa e do que você precisa. Chame no WhatsApp que a gente monta a proposta.",
      ],
    },
    {
      pergunta: "Dá para usar com a marca do meu restaurante?",
      resposta: [
        "Dá. Você escolhe a logo, as cores, a fonte dos títulos e o número de mesas.",
      ],
    },
    {
      pergunta: "Meus garçons conseguem mexer em tudo?",
      resposta: [
        "Não. A equipe usa as comandas. Cardápio, marca e cadastro da equipe ficam só com o administrador.",
      ],
    },
  ],
};

export const restCta = {
  titulo: "Quer ver funcionando?",
  textoAntes: "Resposta em ",
  prazo: "24h",
  textoDepois: ". Me chame no WhatsApp e eu mostro o sistema rodando.",
  acao: { texto: "Falar comigo", href: contato },
};
