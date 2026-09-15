/**
 * Schema do banco. Regras que vem do CLAUDE.md e valem em todo lugar:
 *
 * - Dinheiro SEMPRE em centavos, inteiro. Nunca float, nunca numeric.
 * - Instante (quando algo aconteceu) = timestamp com timezone, em UTC.
 * - Data de calendario (vencimento) = `date`, sem hora e sem fuso: dia 10
 *   e dia 10 em qualquer lugar do mundo, nao um instante.
 * - Id publico = uuid aleatorio, porque ele aparece na URL. Numero de
 *   fatura, que o cliente le, e sequencial e separado do id.
 * - Nunca guardamos token em claro: so o hash. Quem tem o token e o
 *   cliente, no e-mail dele.
 */

import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const criadoEm = () =>
  timestamp("criado_em", { withTimezone: true }).notNull().defaultNow();

/* ------------------------------------------------------------------ *
 * Enums
 * ------------------------------------------------------------------ */

/** ETAPAS.md etapa 4: site, sistema, manutencao. */
export const tipoProduto = pgEnum("tipo_produto", ["site", "sistema", "manutencao"]);

/** Tres estados, nao um booleano: "pausado" nao e nem ativo nem encerrado. */
export const statusProduto = pgEnum("status_produto", ["ativo", "pausado", "encerrado"]);

/**
 * "atrasada" NAO e um status guardado — e derivado: aberta + vencimento
 * no passado. Guardar exigiria um cron so para virar a chave, e ficaria
 * errado entre uma rodada e outra.
 */
export const statusFatura = pgEnum("status_fatura", ["aberta", "paga", "cancelada"]);
export const tipoFatura = pgEnum("tipo_fatura", ["mensalidade", "avulsa"]);
export const formaPagamento = pgEnum("forma_pagamento", ["cartao", "pix", "boleto"]);
export const tipoToken = pgEnum("tipo_token", ["primeiro_acesso", "recuperar_senha"]);
export const tipoEmail = pgEnum("tipo_email", [
  "primeiro_acesso",
  "recuperar_senha",
  "cobranca",
  "pagamento_confirmado",
]);
export const statusEmail = pgEnum("status_email", ["enviado", "falhou"]);

/* ------------------------------------------------------------------ *
 * Clientes
 * ------------------------------------------------------------------ */

export const clientes = pgTable(
  "clientes",
  {
    id: id(),
    nome: text("nome").notNull(),
    /** E-mail de contato e cobranca. Pode diferir do e-mail de login. */
    email: text("email").notNull(),
    /** CPF ou CNPJ, so digitos. Vai impresso no recibo. Opcional. */
    documento: text("documento"),
    telefone: text("telefone"),

    /** Id do mesmo cliente do lado do Asaas, preenchido na etapa 6. */
    asaasClienteId: text("asaas_cliente_id"),

    criadoEm: criadoEm(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("clientes_email_idx").on(t.email),
    uniqueIndex("clientes_asaas_idx").on(t.asaasClienteId),
  ],
);

/* ------------------------------------------------------------------ *
 * Usuarios — quem entra no portal
 *
 * Separado de `clientes` de proposito: um cliente e uma empresa ou uma
 * pessoa que contrata; um usuario e quem digita e-mail e senha. Um dia
 * um cliente pode ter dois (o dono e o contador) sem duplicar cadastro.
 * ------------------------------------------------------------------ */

export const usuarios = pgTable(
  "usuarios",
  {
    id: id(),
    clienteId: text("cliente_id")
      .notNull()
      .references(() => clientes.id, { onDelete: "cascade" }),

    /**
     * E-mail de login, unico no sistema inteiro.
     * SEMPRE gravado e consultado em lower(): senao "Guilherme@x.com" e
     * "guilherme@x.com" viram duas contas, e a segunda so aparece no dia
     * em que alguem nao conseguir entrar.
     */
    email: text("email").notNull(),

    /**
     * bcrypt com sal embutido, gerado pelo pgcrypto DENTRO do Postgres:
     * crypt(prehash, gen_salt('bf', 12)).
     *
     * O hash nao roda no Worker porque a Cloudflare limita o PBKDF2 da
     * Web Crypto a 100 mil iteracoes — abaixo do que a OWASP recomenda — e
     * ainda gastaria o orcamento de CPU justamente no login. No banco o
     * bcrypt custo 12 roda sem teto.
     *
     * `prehash` e o SHA-256 que o Worker calcula antes de mandar: o banco
     * nunca ve a senha real. Ver src/lib/senha.ts.
     *
     * TEXT e nao varchar: o formato do pgcrypto tem 60 caracteres hoje,
     * mas prender o tamanho nao compra nada e quebra calado se o custo ou
     * o algoritmo mudar. null enquanto o usuario ainda nao criou senha.
     */
    senhaHash: text("senha_hash"),

    /** Desliga o acesso sem apagar a linha — apagar levaria as sessoes junto. */
    ativo: boolean("ativo").notNull().default(true),

    /**
     * Trava anti-forca-bruta na propria linha: contador e prazo decididos
     * num UPDATE que le a coluna, nunca um valor vindo do JavaScript. Dois
     * logins errados ao mesmo tempo leriam ambos "3" e gravariam ambos "4",
     * e a trava nunca chegaria.
     */
    tentativas: integer("tentativas").notNull().default(0),
    bloqueadoAte: timestamp("bloqueado_ate", { withTimezone: true }),

    criadoEm: criadoEm(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("usuarios_email_idx").on(t.email),
    index("usuarios_cliente_idx").on(t.clienteId),
  ],
);

/* ------------------------------------------------------------------ *
 * Produtos contratados
 * ------------------------------------------------------------------ */

export const produtos = pgTable(
  "produtos",
  {
    id: id(),
    clienteId: text("cliente_id")
      .notNull()
      .references(() => clientes.id, { onDelete: "restrict" }),

    nome: text("nome").notNull(),
    descricao: text("descricao"),
    tipo: tipoProduto("tipo").notNull().default("site"),
    /** Dominio ou endereco onde o produto vive, quando houver. */
    endereco: text("endereco"),

    /** null = produto sem mensalidade (projeto fechado, so avulsas). */
    mensalidadeCentavos: integer("mensalidade_centavos"),
    /** Dia do mes em que a mensalidade vence. null quando nao ha mensalidade. */
    diaVencimento: integer("dia_vencimento"),

    status: statusProduto("status").notNull().default("ativo"),
    /** Data de inicio do contrato. */
    ativoDesde: date("ativo_desde"),

    /** Id da assinatura recorrente do lado do Asaas (etapa 6). */
    asaasAssinaturaId: text("asaas_assinatura_id"),

    criadoEm: criadoEm(),
  },
  (t) => [
    index("produtos_cliente_idx").on(t.clienteId),
    uniqueIndex("produtos_asaas_idx").on(t.asaasAssinaturaId),
  ],
);

/* ------------------------------------------------------------------ *
 * Faturas — mensalidade e cobranca avulsa na MESMA tabela
 *
 * As duas sao a mesma coisa do ponto de vista do cliente: algo a pagar,
 * com valor e vencimento, que aparece na lista de faturas. O que muda e
 * o `tipo`. Duas tabelas seriam duas vezes o mesmo codigo.
 * ------------------------------------------------------------------ */

export const faturas = pgTable(
  "faturas",
  {
    id: id(),
    /** Sequencial, e o numero que o cliente le no recibo e no e-mail. */
    numero: integer("numero").generatedAlwaysAsIdentity(),

    clienteId: text("cliente_id")
      .notNull()
      .references(() => clientes.id, { onDelete: "restrict" }),
    /** null = cobranca que nao pertence a um produto especifico. */
    produtoId: text("produto_id").references(() => produtos.id, {
      onDelete: "set null",
    }),

    tipo: tipoFatura("tipo").notNull(),
    descricao: text("descricao").notNull(),
    valorCentavos: integer("valor_centavos").notNull(),
    vencimento: date("vencimento").notNull(),

    status: statusFatura("status").notNull().default("aberta"),
    pagoEm: timestamp("pago_em", { withTimezone: true }),
    formaPagamento: formaPagamento("forma_pagamento"),

    /** Id da cobranca no Asaas. Unico, para o webhook nao duplicar baixa. */
    asaasCobrancaId: text("asaas_cobranca_id"),

    criadoEm: criadoEm(),
  },
  (t) => [
    uniqueIndex("faturas_numero_idx").on(t.numero),
    uniqueIndex("faturas_asaas_idx").on(t.asaasCobrancaId),
    index("faturas_cliente_idx").on(t.clienteId),
    index("faturas_status_vencimento_idx").on(t.status, t.vencimento),
  ],
);

/* ------------------------------------------------------------------ *
 * Sessao — o cookie de quem esta logado
 * ------------------------------------------------------------------ */

export const sessoes = pgTable(
  "sessoes",
  {
    id: id(),
    usuarioId: text("usuario_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "cascade" }),
    /** Hash do token do cookie. O valor cru nunca entra no banco. */
    tokenHash: text("token_hash").notNull(),
    expiraEm: timestamp("expira_em", { withTimezone: true }).notNull(),
    criadoEm: criadoEm(),
  },
  (t) => [
    uniqueIndex("sessoes_token_idx").on(t.tokenHash),
    index("sessoes_usuario_idx").on(t.usuarioId),
  ],
);

/* ------------------------------------------------------------------ *
 * Token de acesso — o link que vai no e-mail
 * ------------------------------------------------------------------ */

export const tokensAcesso = pgTable(
  "tokens_acesso",
  {
    id: id(),
    /**
     * Sempre aponta para o cliente. No PRIMEIRO acesso o usuario ainda
     * nao existe — ele nasce quando a senha e criada —, entao `usuarioId`
     * fica null. Em "esqueci a senha" o usuario ja existe e vai preenchido,
     * para o link mexer na conta certa quando o cliente tiver mais de uma.
     */
    clienteId: text("cliente_id")
      .notNull()
      .references(() => clientes.id, { onDelete: "cascade" }),
    usuarioId: text("usuario_id").references(() => usuarios.id, {
      onDelete: "cascade",
    }),
    tokenHash: text("token_hash").notNull(),
    tipo: tipoToken("tipo").notNull(),
    expiraEm: timestamp("expira_em", { withTimezone: true }).notNull(),
    /** Marcado no primeiro uso: link de acesso vale uma vez so. */
    usadoEm: timestamp("usado_em", { withTimezone: true }),
    criadoEm: criadoEm(),
  },
  (t) => [
    uniqueIndex("tokens_acesso_token_idx").on(t.tokenHash),
    index("tokens_acesso_cliente_idx").on(t.clienteId),
  ],
);

/* ------------------------------------------------------------------ *
 * E-mails enviados
 *
 * Existe porque o plano gratuito da Resend guarda historico por 30 dias.
 * Se daqui a tres meses um cliente disser que nunca recebeu a cobranca,
 * o registro precisa estar aqui, nao la.
 * ------------------------------------------------------------------ */

export const emailsEnviados = pgTable(
  "emails_enviados",
  {
    id: id(),
    clienteId: text("cliente_id").references(() => clientes.id, {
      onDelete: "set null",
    }),
    faturaId: text("fatura_id").references(() => faturas.id, {
      onDelete: "set null",
    }),

    tipo: tipoEmail("tipo").notNull(),
    destinatario: text("destinatario").notNull(),
    assunto: text("assunto").notNull(),

    status: statusEmail("status").notNull(),
    /** Id que a Resend devolve, para cruzar com o painel deles. */
    resendId: text("resend_id"),
    erro: text("erro"),

    criadoEm: criadoEm(),
  },
  (t) => [
    index("emails_cliente_idx").on(t.clienteId),
    index("emails_fatura_idx").on(t.faturaId),
  ],
);

/* ------------------------------------------------------------------ *
 * Eventos do Asaas — log CRU
 *
 * O ETAPAS.md pede o evento gravado cru "para eu depurar depois". Mas ele
 * serve para mais do que isso: a entrega do Asaas e "pelo menos uma vez", e
 * a documentacao deles diz, com todas as letras, que "o mesmo evento pode
 * ser enviado mais de uma vez". O indice unico em `evento_id` e o que
 * impede a mesma confirmacao de pagamento de ser processada duas vezes.
 * ------------------------------------------------------------------ */

export const eventosAsaas = pgTable(
  "eventos_asaas",
  {
    id: id(),
    /** O id do EVENTO no Asaas. Unico: e a chave da idempotencia. */
    eventoId: text("evento_id").notNull(),
    tipo: text("tipo").notNull(),
    /** O corpo inteiro, como chegou. Nada e descartado. */
    payload: jsonb("payload").notNull(),

    /** Preenchidos quando da para casar o evento com uma fatura nossa. */
    faturaId: text("fatura_id").references(() => faturas.id, {
      onDelete: "set null",
    }),
    asaasCobrancaId: text("asaas_cobranca_id"),

    /** null enquanto nao processado; com erro, guarda o motivo. */
    processadoEm: timestamp("processado_em", { withTimezone: true }),
    erro: text("erro"),

    criadoEm: criadoEm(),
  },
  (t) => [
    uniqueIndex("eventos_asaas_evento_idx").on(t.eventoId),
    index("eventos_asaas_cobranca_idx").on(t.asaasCobrancaId),
    index("eventos_asaas_pendentes_idx").on(t.processadoEm),
  ],
);

/* ------------------------------------------------------------------ *
 * Relacoes
 * ------------------------------------------------------------------ */

export const clientesRelacoes = relations(clientes, ({ many }) => ({
  usuarios: many(usuarios),
  produtos: many(produtos),
  faturas: many(faturas),
  tokensAcesso: many(tokensAcesso),
}));

export const usuariosRelacoes = relations(usuarios, ({ one, many }) => ({
  cliente: one(clientes, {
    fields: [usuarios.clienteId],
    references: [clientes.id],
  }),
  sessoes: many(sessoes),
}));

export const produtosRelacoes = relations(produtos, ({ one, many }) => ({
  cliente: one(clientes, {
    fields: [produtos.clienteId],
    references: [clientes.id],
  }),
  faturas: many(faturas),
}));

export const faturasRelacoes = relations(faturas, ({ one }) => ({
  cliente: one(clientes, {
    fields: [faturas.clienteId],
    references: [clientes.id],
  }),
  produto: one(produtos, {
    fields: [faturas.produtoId],
    references: [produtos.id],
  }),
}));

export const sessoesRelacoes = relations(sessoes, ({ one }) => ({
  usuario: one(usuarios, {
    fields: [sessoes.usuarioId],
    references: [usuarios.id],
  }),
}));

export const tokensAcessoRelacoes = relations(tokensAcesso, ({ one }) => ({
  cliente: one(clientes, {
    fields: [tokensAcesso.clienteId],
    references: [clientes.id],
  }),
  usuario: one(usuarios, {
    fields: [tokensAcesso.usuarioId],
    references: [usuarios.id],
  }),
}));
