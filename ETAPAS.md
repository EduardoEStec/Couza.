ETAPA 1 Implementar a landing a partir do design aprovado
Design aprovado. Agora implemente no projeto Next.

- Fonte de verdade é /design/mockup.html. Se em algum ponto o mockup for
  impossível ou ruim de implementar, PARE e me diga qual ponto — não improvise
  uma versão diferente.
- Primeiro os tokens no Tailwind (cores, fonte, escala tipográfica, raio,
  espaçamento). Depois os componentes. Nenhum valor mágico solto no meio do JSX.
- Nesta etapa, SÓ a landing. As telas do portal foram desenhadas para eu aprovar
  a identidade, mas serão implementadas nas etapas 3 e 5.
- HTML semântico e acessível: contraste, foco visível, alt em imagem.
- ZERO animação ainda. Só estrutura e estilo.
- O botão "Portal do Cliente" aponta para /portal/login, que ainda não existe.

Critério de sucesso: a landing no navegador está visualmente igual ao mockup em
390px e em 1440px. Me aponte toda diferença que sobrou e por quê.

ETAPA 2 — Animação e polimento
Agora as animações. Instale motion e lenis (só esses dois).

- Lenis para o scroll suave, com respeito a prefers-reduced-motion.
- Motion para: entrada dos elementos ao aparecer na viewport (fade + subida
  pequena, escalonada), hover nos cards e botões, e a transição da nav ao rolar.
- Nada de animação que dependa de rolar dentro de canvas, WebGL ou parallax pesado.
- Alvo: 60fps no mobile. Anime só transform e opacity.

Critério de sucesso: rodando com "reduzir movimento" ligado no sistema, o site
continua totalmente utilizável e sem animação. Verifique isso e me diga o resultado.

Se em algum efeito você achar que Motion não dá conta e quiser outra biblioteca,
me pergunte antes de instalar.

ETAPA 3 — Banco de dados e autenticação
Agora a base do portal. Nada de tela ainda além do necessário para autenticar.

Modelagem (Drizzle + Neon). Proponha o schema e ESPERE minha aprovação antes de
gerar a migration. O que precisa existir, no mínimo:
- clientes (nome, e-mail único, telefone, cpf/cnpj, id do cliente no Asaas)
- usuarios (vinculado ao cliente, e-mail, hash de senha, data de criação)
- tokens de acesso (para primeiro acesso e recuperação de senha: token com hash,
  validade, usado sim/não)
- sessoes
Se você achar que falta ou sobra tabela, fale antes.

Autenticação — o fluxo é este e não tem variação:
- TODO cliente, inclusive quem já tem sistema meu, começa por "Primeiro acesso".
  Não vamos importar senha de sistema nenhum.
- Primeiro acesso: o cliente digita o e-mail. Se existir cliente cadastrado com
  aquele e-mail, mando link de criação de senha. Se não existir, a resposta na
  tela é EXATAMENTE a mesma (não revelar se o e-mail existe).
- O link vale 1 hora, é de uso único, e o token é guardado no banco só como hash.
- Ao criar a senha, o cliente já entra logado e cai no portal.
- Login normal: e-mail + senha.
- "Esqueci minha senha" usa o mesmo mecanismo de token.
- Senha: mínimo 8 caracteres, hash com scrypt via Web Crypto (lembre: sem
  dependência nativa, estamos no Workers).
- Sessão em cookie httpOnly, secure, sameSite lax.
- Rate limit nas rotas de login e de envio de link.

E-mail via Resend, template simples por enquanto — a versão com marca é a Etapa 7.

Telas: /portal/login, /portal/primeiro-acesso, /portal/criar-senha/[token],
/portal/esqueci-senha. No estilo da landing.

Critério de sucesso: eu consigo criar um cliente direto no banco, fazer primeiro
acesso pelo e-mail real, criar senha, entrar, sair e entrar de novo. Token expirado
e token já usado dão erro claro. Me confirme cada um desses casos testado.

ETAPA 4 — Admin mínimo (só meu)
Preciso conseguir cadastrar as coisas antes de construir a tela do cliente.

Um admin em /admin, protegido por login separado (um usuário só, o meu — me
pergunte como você pretende separar isso do login de cliente antes de implementar).

Precisa permitir:
- Cadastrar/editar cliente (nome, e-mail, telefone, documento)
- Cadastrar produto contratado de um cliente: nome, descrição, tipo (site, sistema,
  manutenção), valor da mensalidade em centavos, dia de vencimento, status
  (ativo, pausado, encerrado), data de início
- Lançar cobrança avulsa vinculada a um produto: descrição, valor, vencimento
  (ex.: "feature nova no site — R$ 40,00")
- Ver a lista de faturas de um cliente

Sem integração com Asaas ainda — só banco. A sincronização vem na Etapa 5.
Feio pode, funcional tem que ser. Não gaste tempo com design aqui.

ETAPA 5 — Portal: Meus Produtos e faturas
A tela que o cliente vê ao logar.

/portal — "Meus Produtos":
- Um card por produto contratado: nome, tipo, status, mensalidade, próxima cobrança
- Dentro/abaixo de cada produto, as cobranças avulsas ligadas a ele
- Um resumo no topo: total mensal, se tem algo em atraso, valor a vencer

/portal/faturas:
- Abas ou filtro: em aberto, pagas, atrasadas
- Cada fatura: descrição, valor, vencimento, status, data de pagamento
- Fatura em aberto ou atrasada tem botão "Pagar"
- Fatura futura tem "Antecipar pagamento" (mesmo destino do "Pagar")
- Fatura paga permite baixar o comprovante

Os botões de pagar levam para /portal/pagamento/[id], que nesta etapa é só uma
página vazia — o checkout é a Etapa 6.

Tudo com dado real do banco. Se não tiver dado, mostre estado vazio de verdade
("nenhuma fatura em aberto"), não invente registro de exemplo.

ETAPA 6 — Integração Asaas (API + webhooks)
Agora ligamos no Asaas. Comece pelo SANDBOX, nunca na conta de produção.

IMPORTANTE: não confie na sua memória sobre a API do Asaas. Leia a documentação
oficial atual antes de escrever qualquer chamada, e me diga qual versão da API
você está usando. Se algum endpoint que você esperava não existir mais, PARE e
me avise em vez de improvisar.

O que precisa funcionar:
- Criar/atualizar cliente no Asaas quando eu cadastro no admin, guardando o id deles
- Criar assinatura recorrente para a mensalidade de cada produto
- Criar cobrança avulsa quando eu lanço no admin
- Receber webhooks e atualizar o status da fatura no meu banco (criada, confirmada,
  recebida, vencida, estornada)
- Validar o webhook (token/assinatura) e ser idempotente: o mesmo evento chegando
  duas vezes não pode duplicar nada
- Registrar todo evento recebido numa tabela de log, cru, para eu depurar depois

Camada de integração isolada em um módulo só, com tipos. O resto da aplicação não
fala com o Asaas direto.

Erro da API do Asaas nunca pode virar tela branca: trate, registre e mostre
mensagem entendível.

Critério de sucesso: no sandbox, eu crio um cliente e um produto no admin, a
assinatura aparece no Asaas, e quando eu simulo o pagamento a fatura muda de
status sozinha no meu portal. Me diga se algum desses passos não fechou.

ETAPA 7 — Checkout no meu domínio
O checkout inteiro é meu — o cliente não sai de courte.com.br em momento nenhum.
Só as chamadas de API vão para o Asaas.

/portal/pagamento/[id], com escolha de forma:
- Cartão de crédito ou débito: formulário meu, mas o dado do cartão vai
  TOKENIZADO direto para o Asaas. Número de cartão não passa pelo meu servidor
  nem entra em log, nunca, em hipótese alguma. Se a forma que você planeja fazer
  isso implicar o dado bruto tocando meu backend, PARE e me explique antes.
- Pix: gerar o QR code e o copia-e-cola na minha tela, com contador de validade e
  detecção automática de pagamento (webhook ou polling — me diga qual você escolheu
  e por quê).
- Boleto: gerar, mostrar linha digitável para copiar e link do PDF. Quero o QR do
  Pix embutido no boleto também — confirme na documentação se o Asaas faz isso
  automático ou se precisa de configuração, e me diga o que achou.

Depois de pagar: tela de confirmação e a fatura já atualizada no portal.

Se o pagamento falhar, mensagem específica do motivo, não um "erro" genérico.

ETAPA 8 — E-mails de cobrança com a minha marca (e SMS)
As cobranças também saem por fora do portal.

E-mail (Resend), com a identidade visual da landing:
- Nova cobrança gerada: valor, descrição, vencimento, e os botões de pagamento
  (cartão, Pix, boleto) levando direto para o meu checkout já com a fatura
  selecionada — não para o site do Asaas
- Lembrete 3 dias antes do vencimento
- Aviso de vencido
- Confirmação de pagamento recebido

Agendamento por Cloudflare Cron Trigger. Antes de implementar, me diga o horário
que você pretende rodar e a proteção contra envio duplicado.

O e-mail precisa renderizar em Gmail e Outlook — tabela e CSS inline, sem firula.

SMS: deixe pronto para ligar, mas DESLIGADO por padrão, atrás de uma flag de
ambiente. É cobrado por envio e só vou ativar depois. Não gaste tempo com isso
além do mínimo.

ETAPA 9 — Deploy
Publicar em produção.

- Deploy no Cloudflare Workers, domínio courte.com.br (o DNS está na Cloudflare)
- Banco de produção separado do de desenvolvimento no Neon
- Todos os segredos como secret do Workers, nenhum no repositório
- Trocar a chave do Asaas de sandbox para produção só no último passo, e me avisar
  antes de fazer
- Webhook do Asaas apontando para a URL de produção
- Checklist final para eu percorrer: primeiro acesso, login, ver produto, pagar por
  Pix, receber o e-mail

Me entregue o checklist e me diga o que você NÃO conseguiu testar em produção e por quê.