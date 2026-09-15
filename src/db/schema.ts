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
    email: text("email").notNull(),
    /** CPF ou CNPJ, so digitos. Vai impresso no recibo. */
    documento: text("documento"),
    telefone: text("telefone"),

    /**
     * PBKDF2 via Web Crypto (Workers nao aceita bcrypt/argon2 nativos).
     * As iteracoes ficam gravadas junto para poder aumentar o custo no
     * futuro e re-hashear no proximo login, sem invalidar senha antiga.
     */
    senhaHash: text("senha_hash"),
    senhaSalt: text("senha_salt"),
    senhaIteracoes: integer("senha_iteracoes"),

    criadoEm: criadoEm(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("clientes_email_idx").on(t.email)],
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
    /** "site institucional", "sistema de pedidos"… texto livre por ora. */
    tipo: text("tipo"),
    /** Dominio ou endereco onde o produto vive, quando houver. */
    endereco: text("endereco"),

    /** null = produto sem mensalidade (projeto fechado, so avulsas). */
    mensalidadeCentavos: integer("mensalidade_centavos"),
    /** Dia do mes em que a mensalidade vence. null quando nao ha mensalidade. */
    diaVencimento: integer("dia_vencimento"),

    ativo: boolean("ativo").notNull().default(true),
    ativoDesde: date("ativo_desde"),

    criadoEm: criadoEm(),
  },
  (t) => [index("produtos_cliente_idx").on(t.clienteId)],
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
    clienteId: text("cliente_id")
      .notNull()
      .references(() => clientes.id, { onDelete: "cascade" }),
    /** Hash do token do cookie. O valor cru nunca entra no banco. */
    tokenHash: text("token_hash").notNull(),
    expiraEm: timestamp("expira_em", { withTimezone: true }).notNull(),
    criadoEm: criadoEm(),
  },
  (t) => [
    uniqueIndex("sessoes_token_idx").on(t.tokenHash),
    index("sessoes_cliente_idx").on(t.clienteId),
  ],
);

/* ------------------------------------------------------------------ *
 * Token de acesso — o link que vai no e-mail
 * ------------------------------------------------------------------ */

export const tokensAcesso = pgTable(
  "tokens_acesso",
  {
    id: id(),
    clienteId: text("cliente_id")
      .notNull()
      .references(() => clientes.id, { onDelete: "cascade" }),
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
 * Relacoes
 * ------------------------------------------------------------------ */

export const clientesRelacoes = relations(clientes, ({ many }) => ({
  produtos: many(produtos),
  faturas: many(faturas),
  sessoes: many(sessoes),
  tokensAcesso: many(tokensAcesso),
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
  cliente: one(clientes, {
    fields: [sessoes.clienteId],
    references: [clientes.id],
  }),
}));

export const tokensAcessoRelacoes = relations(tokensAcesso, ({ one }) => ({
  cliente: one(clientes, {
    fields: [tokensAcesso.clienteId],
    references: [clientes.id],
  }),
}));
