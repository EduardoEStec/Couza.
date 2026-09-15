CREATE TABLE "eventos_asaas" (
	"id" text PRIMARY KEY NOT NULL,
	"evento_id" text NOT NULL,
	"tipo" text NOT NULL,
	"payload" jsonb NOT NULL,
	"fatura_id" text,
	"asaas_cobranca_id" text,
	"processado_em" timestamp with time zone,
	"erro" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "produtos" ADD COLUMN "asaas_assinatura_id" text;--> statement-breakpoint
ALTER TABLE "eventos_asaas" ADD CONSTRAINT "eventos_asaas_fatura_id_faturas_id_fk" FOREIGN KEY ("fatura_id") REFERENCES "public"."faturas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "eventos_asaas_evento_idx" ON "eventos_asaas" USING btree ("evento_id");--> statement-breakpoint
CREATE INDEX "eventos_asaas_cobranca_idx" ON "eventos_asaas" USING btree ("asaas_cobranca_id");--> statement-breakpoint
CREATE INDEX "eventos_asaas_pendentes_idx" ON "eventos_asaas" USING btree ("processado_em");--> statement-breakpoint
CREATE UNIQUE INDEX "produtos_asaas_idx" ON "produtos" USING btree ("asaas_assinatura_id");