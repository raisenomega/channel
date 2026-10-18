/**
 * HUB by Raisen — O-3: composicion + registro de las rutas OAuth de canales (Zernio BSP).
 * Inyecta profileService (O-6), nonces repo (N-9), tenant repo y channel_connections repo.
 * Env: ZERNIO_API_KEY + OAUTH_REDIRECT_BASE (owner setea en Railway). C4 <=75.
 */
import type { RouteDefinition } from "./server-types.ts";
import { TenantRepositorySupabase } from "../identity/infrastructure/tenant.repository.supabase.ts";
import { ChannelConnectionsRepo } from "../channels/infrastructure/channel-connections.repository.ts";
import { OAuthNoncesRepository } from "../oauth/infrastructure/oauth-nonces.repository.supabase.ts";
import { ZernioProfileService } from "../channels/application/zernio-profile.service.ts";
import { rutaChannelConnectUrl } from "../channels/presentation/routes/connect-url.routes.ts";
import { rutaZernioCallback } from "../channels/presentation/routes/zernio-callback.routes.ts";
import { rutaPendingPages, rutaSelectPage } from "../channels/presentation/routes/fb-pages.routes.ts";
import { listOwnAccounts } from "../channels/infrastructure/zernio-connect.client.ts";

function getEnv(n: string): string {
  const d = (globalThis as Record<string, unknown>)["Deno"] as { env?: { get?(k: string): string | undefined } } | undefined;
  const p = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return (d?.env?.get ? d.env.get(n) : p?.env?.[n]) ?? "";
}

export function registrarOAuthChannelsRutas(): RouteDefinition[] {
  const apiKey = getEnv("ZERNIO_API_KEY");
  const redirectBase = getEnv("OAUTH_REDIRECT_BASE");
  const tenantRepo = new TenantRepositorySupabase();
  const noncesRepo = new OAuthNoncesRepository();
  const connRepo = new ChannelConnectionsRepo();
  const profileService = new ZernioProfileService(tenantRepo, apiKey);
  return [
    rutaChannelConnectUrl({ profileService, noncesRepo, apiKey, redirectBase }),
    rutaZernioCallback({ noncesRepo, tenantRepo, connRepo, listOwnAccounts: (pid) => listOwnAccounts(apiKey, pid) }),
    rutaPendingPages({ apiKey, tenantRepo, connRepo }),
    rutaSelectPage({ apiKey, tenantRepo, connRepo }),
  ];
}
