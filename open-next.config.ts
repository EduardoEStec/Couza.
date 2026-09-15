import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * Configuração do adaptador OpenNext para Cloudflare Workers.
 *
 * Está vazia de propósito, e isso é uma decisão, não esquecimento:
 *
 * - SEM cache incremental em R2. O R2 serve para persistir revalidação de
 *   ISR entre instâncias do Worker, e este site não tem nenhuma página ISR
 *   (`next build` não lista nenhuma, e não existe `export const revalidate`
 *   em lugar nenhum). Ligar R2 seria criar um bucket, uma conta de
 *   armazenamento e um ponto de falha para cachear coisa nenhuma.
 *
 * - SEM binding de imagens. O único `next/image` do projeto é o QR do Pix,
 *   que já é `unoptimized` — é um data: URI em base64, que o otimizador não
 *   tem o que otimizar.
 *
 * Se um dia aparecer página com ISR, o cache em R2 volta para cá.
 */
export default defineCloudflareConfig();
