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
  estão fora.
- **Hash de senha roda no POSTGRES, não no Worker** (decidido em 14/09/2026,
  seguindo o padrão do urblab-dashboard). Antes esta linha dizia "scrypt ou
  PBKDF2 via Web Crypto"; mudou porque a Cloudflare limita o PBKDF2 da Web
  Crypto a 100 mil iterações — abaixo do que a OWASP recomenda — e o hash
  ainda gastaria o orçamento de CPU do Worker justamente no login.
  - O Worker calcula um **pré-hash SHA-256** e manda só isso. O banco nunca vê
    a senha real, então nem o Neon nem quem roubar a `DATABASE_URL` aprende a
    senha que o cliente talvez repita no e-mail dele.
  - O Postgres aplica `crypt(prehash, gen_salt('bf', 12))` via pgcrypto.
  - **A senha nunca entra em log, nunca é interpolada na string de SQL e nunca
    sai numa mensagem de erro. Sempre parâmetro.**
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

## Decisões já tomadas (não reabrir sem falar comigo)
- **Admin**: entra por usuário e senha em variável de ambiente. **Não existe
  tabela de admin** e nem coluna de privilégio no cliente. É uma pessoa só.
- **"Atrasada" não é status guardado.** O banco guarda `aberta`, `paga`,
  `cancelada`. Atrasada é derivada: aberta + vencimento no passado.
- **Mensalidade e cobrança avulsa vivem na mesma tabela** (`faturas`),
  separadas por `tipo`.
- **`dia_vencimento` fica no produto**, não no cliente e não global.
- **`documento` do cliente (CPF/CNPJ) é OBRIGATÓRIO** (revertido em
  15/09/2026: antes era opcional). O Asaas exige `cpfCnpj` para criar
  cliente, e deixar opcional aqui só adiava o erro.
- **REGRA GERAL que saiu disso: o que o Asaas obriga, a gente obriga.**
  Campo obrigatório lá vira obrigatório aqui, validado na tela. É melhor a
  tela recusar do que o cadastro nascer e a sincronização falhar calada.
  Já aplicado: CPF/CNPJ do cliente; e produto com mensalidade exige dia de
  vencimento, porque a assinatura no Asaas precisa do primeiro vencimento.
- **Id na URL é uuid aleatório**; o número da fatura que o cliente lê é
  sequencial e separado do id.
- **Token nunca em claro no banco** — sessão e link de acesso guardam só o hash.
- **Pagar pelo e-mail leva ao login**, não a link com token.
- **E-mails de cobranca rodam 09:00 de Brasilia** (`0 12 * * *`, porque o
  Cron Trigger da Cloudflare conta em UTC). Uma execucao por dia.
- **Aviso de vencido sai UMA vez por fatura**, nao repete (15/09/2026).
- **Confirmacao de pagamento sai pelo webhook, nao pelo cron** — quem acabou
  de pagar nao pode esperar ate a manha seguinte para saber.
- **Envio duplicado e barrado por indice unico parcial**
  (`emails_uma_vez_idx (fatura_id, tipo)`, cobrindo `enviando` e `enviado`),
  nunca por um `if`. A linha e gravada ANTES de chamar a Resend, como
  `enviando`, para reservar a vaga; vira `enviado` ou `falhou` depois.
- **`enviando` e um estado de verdade, nao um detalhe**: ele separa
  "reservei a vaga" de "a Resend confirmou". `liberarTravadas()` solta o que
  ficar em `enviando` por mais de 15 minutos — isso e um processo que
  morreu, e sem soltar a fatura ficaria marcada como avisada sem nunca ter
  sido avisada. Soltar e seguro por causa da Idempotency-Key.
- **Todo envio tenta 3 vezes** (400ms e 1200ms de espera), com
  `Idempotency-Key` da Resend para a repeticao nunca virar e-mail duplicado.
  Erro permanente (400/401/403/404/405/422 e cota do dia estourada) nao e
  repetido.
- **Destino pos-login vem de lista fechada** (`/portal/...`), nunca da URL
  crua: aceitar destino arbitrario transformaria courte.com.br em trampolim
  de golpe.
- **Boleto vai por link para o portal, nunca anexado** — anexo impede o envio
  em lote da Resend, e o portal sempre tem o código atual.

## Design aprovado
O mockup aprovado vive em `design/` e no canvas publicado. Tokens, telas e a
especificação de movimento saíram de lá — não improvise valor de cor, raio,
duração ou curva que já esteja definido no quadro "Tokens" ou no quadro "Movimento".

@AGENTS.md
