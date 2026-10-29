/**
 * HUB by Raisen — Fabrica de TemplatesDeps para el servidor (Slide 4.9).
 * Compuerta #19: usa el ChannelRouter real, sin stubs inline. C4 ≤75.
 */
import { WhatsAppTemplateRepositorySupabase } from "../templates/infrastructure/template-repo-whatsapp.ts";
import { CreateTemplateHandler } from "../templates/application/create-template.handler.ts";
import { CreateTemplateWithZernioHandler } from "../templates/application/create-template-with-zernio.handler.ts";
import { ListTemplatesQuery } from "../templates/application/list-templates.query.ts";
import { PatchTemplateHandler } from "../templates/application/patch-template.handler.ts";
import { ImportTemplateLibraryHandler } from "../templates/application/import-template-library.handler.ts";
import { SyncTemplateStatusHandler } from "../templates/application/sync-template-status.handler.ts";
import { ZernioCredentialsRepository } from "../channels/infrastructure/zernio.credentials.ts";
import { getEnv } from "../shared/infrastructure/supabase-rest.helper.ts";
import { obtenerWhatsAppAccountId } from "../templates/infrastructure/wa-account.query.ts";
import { listarEstadoZernio } from "../templates/infrastructure/zernio-status.client.ts";
import type { TemplatesDeps } from "../templates/presentation/templates.routes.ts";

export async function buildTemplatesDeps(): Promise<TemplatesDeps> {
  const repo = new WhatsAppTemplateRepositorySupabase();
  const creds = await new ZernioCredentialsRepository().leer();
  const apiKey = creds.ok ? creds.value.apiKey : (getEnv("ZERNIO_API_KEY") ?? "");
  const secret = creds.ok ? creds.value.webhookSecret : (getEnv("ZERNIO_WEBHOOK_SECRET") ?? "");
  const apiKeyFn = () => apiKey;
  const accountIdFn = (tenantId: string) => obtenerWhatsAppAccountId(tenantId);
  const estadoLive = async (tenantId: string) => {
    const acc = await obtenerWhatsAppAccountId(tenantId);
    return acc ? listarEstadoZernio(apiKey, acc) : [];
  };
  return {
    create: new CreateTemplateWithZernioHandler(new CreateTemplateHandler(repo), repo, apiKeyFn, accountIdFn),
    list: new ListTemplatesQuery(repo),
    patch: new PatchTemplateHandler(repo, apiKeyFn),
    import: new ImportTemplateLibraryHandler(repo, apiKeyFn, accountIdFn),
    syncStatus: new SyncTemplateStatusHandler(repo),
    estadoLive,
    webhookSecret: secret,
    repo,
  };
}