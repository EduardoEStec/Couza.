DROP INDEX "emails_uma_vez_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "emails_uma_vez_idx" ON "emails_enviados" USING btree ("fatura_id","tipo") WHERE status in ('enviando', 'enviado');