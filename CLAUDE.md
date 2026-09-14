# Projeto: courte.com.br — site institucional + portal do cliente

## Quem sou
Guilherme Courte, presto serviços de TI como pessoa física (CPF): criação de sites,
sistemas sob medida e afins. Este projeto é o meu próprio site: uma landing page
comercial + uma área logada onde meus clientes veem o que contrataram e pagam.

## REGRA DE OURO — leia antes de qualquer linha de código
Quando tiver dúvida, PERGUNTE. Não decida por conta própria, não assuma, não invente.
Isso vale para: nomes de rotas, estrutura de banco, textos do site, regras de negócio,
qual biblioteca instalar, comportamento de erro, o que fazer quando a API do Asaas
devolve algo inesperado.
- Se existirem duas interpretações possíveis do que pedi, apresente as duas e espere.
- Se algo que pedi for mais complicado do que precisa ser, diga isso antes de fazer.
- Nunca preencha lacuna com placeholder silencioso ou dado falso ("João da Silva",
  "R$ 99,90", lorem ipsum) sem me avisar explicitamente que aquilo é provisório.
- Se travar ou se confundir, pare e diga o que não está claro. Não chute.

## Regras de trabalho
- Mudança cirúrgica: mexa só no que a tarefa exige. Não refatore código vizinho,
  não "melhore" formatação ou comentários que não são da tarefa.
- Simplicidade primeiro: o mínimo de código que resolve. Nada especulativo,
  nada de abstração para uso único, nada de feature que eu não pedi.
- Antes de escrever, leia: os arquivos que exportam o que você vai usar, quem chama
  o que você vai mudar, os utilitários compartilhados.
- Checkpoint ao fim de cada passo relevante: o que foi feito, o que foi verificado,
  o que falta.
- Falhe alto: "pronto" está errado se algo foi pulado. "Testes passam" está errado
  se algum foi ignorado. Prefira expor incerteza a escondê-la.
- Não instale dependência nova sem me perguntar antes, com o motivo.

## Stack (decidida — não trocar sem falar comigo)
- Next.js 16 (App Router, TypeScript, Turbopack por padrão)
  - Era Next 15. Trocado em 14/09/2026, com meu aval: o Next 15 embute um
    `postcss` com falha alta e a única correção é subir para o 16.3.5.
  - Next 16 tem mudanças que quebram em relação ao 15. Os docs da versão
    instalada ficam em `node_modules/next/dist/docs/` — leia antes de escrever.
    `middleware` virou `proxy`; `cookies()`/`headers()`/`params` só assíncronos.
- Tailwind CSS v4 — configuração é CSS-first, via `@theme` em
  `src/app/globals.css`. Não existe `tailwind.config.js`.
- Motion (`motion`, ex-framer-motion) para animação de componentes
- Lenis para scroll suave
- Drizzle ORM + Postgres no Neon (driver serverless HTTP)
- Deploy: Cloudflare Workers via OpenNext
- E-mail transacional: Resend
- Pagamentos: Asaas (https://www.asaas.com) — conta pessoa física

## Restrições que vêm do ambiente (importantes)
- Roda em Cloudflare Workers: **sem dependências nativas**. bcrypt/argon2 nativos
  estão fora. Hash de senha com scrypt ou PBKDF2 via Web Crypto API.
- Sem `fs`, sem processo de longa duração, sem cron interno: tarefa agendada é
  Cloudflare Cron Trigger.
- Acesso ao Postgres pelo driver serverless da Neon (HTTP), não TCP.
- Segredos (chave do Asaas, Resend, banco) só em variável de ambiente. Nunca no
  código, nunca commitados, nunca em log.
- Todo valor monetário em centavos, inteiro. Nunca float.
- Datas em UTC no banco, exibidas em America/Sao_Paulo.
- Todo o texto visível ao usuário em português do Brasil.

## O produto, em uma frase por parte
1. Landing page comercial que vende meus serviços.
2. Botão "Portal do Cliente" → login por e-mail e senha.
3. Primeiro acesso: cliente informa o e-mail, recebe link para criar senha, cria e
   já entra logado.
4. Dentro do portal: "Meus Produtos" (sites/sistemas contratados, mensalidade de
   cada um, cobranças avulsas), faturas pagas, próximas, atrasadas.
5. Cliente paga por lá: cartão, Pix ou boleto — checkout todo no meu domínio,
   Asaas só por API.
6. Cobranças também saem por e-mail com a minha marca (e SMS, se eu ligar).
7. Um admin só meu para cadastrar cliente, produto, mensalidade e cobrança avulsa.

## Design aprovado
O mockup aprovado vive em `design/` e no canvas publicado. Tokens, telas e a
especificação de movimento saíram de lá — não improvise valor de cor, raio,
duração ou curva que já esteja definido no quadro "Tokens" ou no quadro "Movimento".

@AGENTS.md
