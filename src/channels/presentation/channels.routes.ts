/**
 * HUB by Raisen — Rutas de canales/social accounts (Slide 4.2a).
 * 4 rutas: connect-url, zernio-sync, connected-accounts (Zernio en vivo), list channels.
 * C4 ≤75.
 */
import type { RouteDefinition, RequestContext } from "../../server/server-types.ts";
import type { ConnectSocialAccountHandler } from "../application/connect-social-account.handler.ts";
import type { ZernioSyncHandler } from "../application/zernio-sync.handler.ts";
import type { ChannelConnectionsRepo } from "../infrastructure/channel-connections.repository.ts";
import type { ConnectedItem } from "../../lib/zernioConnect.ts";

export interface ChannelsDeps {
  readonly connectHandler: ConnectSocialAccountHandler;
  readonly syncHandler: ZernioSyncHandler;
  readonly repo: ChannelConnectionsRepo;
  readonly zernioApiKey: string;
}

export function rutaConnectUrl(deps: ChannelsDeps): RouteDefinition {
  return {
    method: "GET", path: "/tenants/:id/social-accounts/:platform/connect-url",
    handler: async (ctx: RequestContext) => {
      const parts = ctx.path.split("/");
      const tenantId = parts[2] ?? "";
      const platform = parts[4] ?? "";
      const r = await deps.connectHandler.ejecutar(tenantId, platform);
      if (!r.ok) return { ok: false, error: { kind: r.error } };
      return { ok: true, auth_url: r.value.authUrl };
    },
  };
}
export function rutaZernioSync(deps: ChannelsDeps): RouteDefinition {
  return {
    method: "POST", path: "/tenants/:id/social-accounts/:platform/zernio-sync",
    handler: async (ctx: RequestContext) => {
      const parts = ctx.path.split("/");
      const tenantId = parts[2] ?? "";
      const platform = parts[4] ?? "";
      const r = await deps.syncHandler.ejecutar(tenantId, platform);
      if (!r.ok) return { ok: false, error: { kind: r.error } };
      return { ok: true, status: r.value.status, zernio_account_id: null };
    },
  };
}
export function rutaConnectedAccounts(deps: ChannelsDeps): RouteDefinition {
  return {
    method: "GET", path: "/tenants/:id/connected-accounts",
    handler: async (_ctx: RequestContext) => {
      try {
        const r = await fetch("https://api.zernio.io/v1/connected-accounts", {
          headers: { Authorization: `Bearer ${deps.zernioApiKey}` },
        });
        if (!r.ok) return { ok: false, error: { kind: "zernio_error" } };
        const data = await r.json() as { items?: Array<{ platform: string; handle?: string; followers_count?: number; zernio_account_id: string }> };
        const items: ConnectedItem[] = (data.items ?? []).map((a) => ({
          platform: a.platform,
          handle: a.handle ?? null, zernio_account_id: a.zernio_account_id,
          ...(a.followers_count !== undefined ? { followers_count: a.followers_count } : {}),
        }));
        return { ok: true, items };
      } catch { return { ok: false, error: { kind: "zernio_error" } }; }
    },
  };
}
export function rutaListChannels(deps: ChannelsDeps): RouteDefinition {
  return {
    method: "GET", path: "/tenants/:id/channels",
    handler: async (ctx: RequestContext) => {
      const tenantId = (ctx.path.split("/")[2] ?? "") as never;
      const r = await deps.repo.listar(tenantId);
      if (!r.ok) return { ok: false, error: { kind: "persistence_error" } };
      return { ok: true, channels: r.value };
    },
  };
}