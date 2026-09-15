ALTER TYPE "public"."tipo_email" ADD VALUE 'cobranca_nova' BEFORE 'pagamento_confirmado';--> statement-breakpoint
ALTER TYPE "public"."tipo_email" ADD VALUE 'cobranca_lembrete' BEFORE 'pagamento_confirmado';--> statement-breakpoint
ALTER TYPE "public"."tipo_email" ADD VALUE 'cobranca_vencida' BEFORE 'pagamento_confirmado';--> statement-breakpoint
CREATE UNIQUE INDEX "emails_uma_vez_idx" ON "emails_enviados" USING btree ("fatura_id","tipo") WHERE status = 'enviado';