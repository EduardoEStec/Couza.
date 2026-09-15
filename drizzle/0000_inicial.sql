CREATE TYPE "public"."forma_pagamento" AS ENUM('cartao', 'pix', 'boleto');--> statement-breakpoint
CREATE TYPE "public"."status_email" AS ENUM('enviado', 'falhou');--> statement-breakpoint
CREATE TYPE "public"."status_fatura" AS ENUM('aberta', 'paga', 'cancelada');--> statement-breakpoint
CREATE TYPE "public"."tipo_email" AS ENUM('primeiro_acesso', 'recuperar_senha', 'cobranca', 'pagamento_confirmado');--> statement-breakpoint
CREATE TYPE "public"."tipo_fatura" AS ENUM('mensalidade', 'avulsa');--> statement-breakpoint
CREATE TYPE "public"."tipo_token" AS ENUM('primeiro_acesso', 'recuperar_senha');--> statement-breakpoint
CREATE TABLE "clientes" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"documento" text,
	"telefone" text,
	"asaas_cliente_id" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emails_enviados" (
	"id" text PRIMARY KEY NOT NULL,
	"cliente_id" text,
	"fatura_id" text,
	"tipo" "tipo_email" NOT NULL,
	"destinatario" text NOT NULL,
	"assunto" text NOT NULL,
	"status" "status_email" NOT NULL,
	"resend_id" text,
	"erro" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faturas" (
	"id" text PRIMARY KEY NOT NULL,
	"numero" integer GENERATED ALWAYS AS IDENTITY (sequence name "faturas_numero_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"cliente_id" text NOT NULL,
	"produto_id" text,
	"tipo" "tipo_fatura" NOT NULL,
	"descricao" text NOT NULL,
	"valor_centavos" integer NOT NULL,
	"vencimento" date NOT NULL,
	"status" "status_fatura" DEFAULT 'aberta' NOT NULL,
	"pago_em" timestamp with time zone,
	"forma_pagamento" "forma_pagamento",
	"asaas_cobranca_id" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "produtos" (
	"id" text PRIMARY KEY NOT NULL,
	"cliente_id" text NOT NULL,
	"nome" text NOT NULL,
	"tipo" text,
	"endereco" text,
	"mensalidade_centavos" integer,
	"dia_vencimento" integer,
	"ativo" boolean DEFAULT true NOT NULL,
	"ativo_desde" date,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessoes" (
	"id" text PRIMARY KEY NOT NULL,
	"usuario_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"expira_em" timestamp with time zone NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tokens_acesso" (
	"id" text PRIMARY KEY NOT NULL,
	"cliente_id" text NOT NULL,
	"usuario_id" text,
	"token_hash" text NOT NULL,
	"tipo" "tipo_token" NOT NULL,
	"expira_em" timestamp with time zone NOT NULL,
	"usado_em" timestamp with time zone,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" text PRIMARY KEY NOT NULL,
	"cliente_id" text NOT NULL,
	"email" text NOT NULL,
	"senha_hash" text,
	"senha_salt" text,
	"senha_iteracoes" integer,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "emails_enviados" ADD CONSTRAINT "emails_enviados_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emails_enviados" ADD CONSTRAINT "emails_enviados_fatura_id_faturas_id_fk" FOREIGN KEY ("fatura_id") REFERENCES "public"."faturas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faturas" ADD CONSTRAINT "faturas_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faturas" ADD CONSTRAINT "faturas_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessoes" ADD CONSTRAINT "sessoes_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tokens_acesso" ADD CONSTRAINT "tokens_acesso_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tokens_acesso" ADD CONSTRAINT "tokens_acesso_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "clientes_email_idx" ON "clientes" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "clientes_asaas_idx" ON "clientes" USING btree ("asaas_cliente_id");--> statement-breakpoint
CREATE INDEX "emails_cliente_idx" ON "emails_enviados" USING btree ("cliente_id");--> statement-breakpoint
CREATE INDEX "emails_fatura_idx" ON "emails_enviados" USING btree ("fatura_id");--> statement-breakpoint
CREATE UNIQUE INDEX "faturas_numero_idx" ON "faturas" USING btree ("numero");--> statement-breakpoint
CREATE UNIQUE INDEX "faturas_asaas_idx" ON "faturas" USING btree ("asaas_cobranca_id");--> statement-breakpoint
CREATE INDEX "faturas_cliente_idx" ON "faturas" USING btree ("cliente_id");--> statement-breakpoint
CREATE INDEX "faturas_status_vencimento_idx" ON "faturas" USING btree ("status","vencimento");--> statement-breakpoint
CREATE INDEX "produtos_cliente_idx" ON "produtos" USING btree ("cliente_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sessoes_token_idx" ON "sessoes" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "sessoes_usuario_idx" ON "sessoes" USING btree ("usuario_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tokens_acesso_token_idx" ON "tokens_acesso" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "tokens_acesso_cliente_idx" ON "tokens_acesso" USING btree ("cliente_id");--> statement-breakpoint
CREATE UNIQUE INDEX "usuarios_email_idx" ON "usuarios" USING btree ("email");--> statement-breakpoint
CREATE INDEX "usuarios_cliente_idx" ON "usuarios" USING btree ("cliente_id");