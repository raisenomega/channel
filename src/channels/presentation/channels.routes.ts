/**
 * HUB by Raisen — Rutas de canales/social accounts (Slide 4.2a).
 * 4 rutas: connect-url, zernio-sync, connected-accounts (Zernio en vivo), list channels.
 * JWT obligatorio + tenant del path == claim (Compuerta #17, Hotfix F). C4 <=75.
 */
import type { RouteDefinition, RequestContext } from "../../server/server-types.ts";
import { requireTenantAuth } from "../../server/auth-helpers.ts";
import type { ConnectSocialAccountHandler } from "../application/connect-social-account.handler.ts";
import type { ZernioSyncHandler } from "../application/zernio-sync.handler.ts";
import type { ChannelConnectionsRepo } from "../infrastructure/channel-connections.repository.ts";

interface ConnectedItem { platform: string; handle: string | null; zernio_account_id: string; followers_count?: number | null; }
interface ZernioAccount { platform: string; handle?: string; followers_count?: number; zernio_account_id: string; }

export interface ChannelsDeps {
  readonly connectHandler: ConnectSocialAccountHandler;
  readonly syncHandler: ZernioSyncHandler;
  readonly repo: ChannelConnectionsRepo;
  readonly zernioApiKey: string;
}

const seg = (ctx: RequestContext, k: string, i: number): string => ctx.params[k] ?? ctx.path.split("/")[i] ?? "";

export function rutaConnectUrl(deps: ChannelsDeps): RouteDefinition {
  return {
    method: "GET", path: "/tenants/:id/social-accounts/:platform/connect-url",
    handler: async (ctx: RequestContext) => {
      const auth = await requireTenantAuth(ctx, seg(ctx, "id", 2)); if (!auth.ok) return auth.error;
      const r = await deps.connectHandler.ejecutar(auth.value.tenantId, seg(ctx, "platform", 4));
      if (!r.ok) return { ok: false, error: { kind: r.error } };
      return { ok: true, auth_url: r.value.authUrl };
    },
  };
}
export function rutaZernioSync(deps: ChannelsDeps): RouteDefinition {
  return {
    method: "POST", path: "/tenants/:id/social-accounts/:platform/zernio-sync",
    handler: async (ctx: RequestContext) => {
      const auth = await requireTenantAuth(ctx, seg(ctx, "id", 2)); if (!auth.ok) return auth.error;
      const r = await deps.syncHandler.ejecutar(auth.value.tenantId, seg(ctx, "platform", 4));
      if (!r.ok) return { ok: false, error: { kind: r.error } };
      return { ok: true, status: r.value.status, zernio_account_id: null };
    },
  };
}
export function rutaConnectedAccounts(deps: ChannelsDeps): RouteDefinition {
  return {
    method: "GET", path: "/tenants/:id/connected-accounts",
    handler: async (ctx: RequestContext) => {
      const auth = await requireTenantAuth(ctx, seg(ctx, "id", 2)); if (!auth.ok) return auth.error;
      try {
        const r = await fetch("https://api.zernio.io/v1/connected-accounts", { headers: { Authorization: `Bearer ${deps.zernioApiKey}` } });
        if (!r.ok) return { ok: false, error: { kind: "zernio_error" } };
        const data = await r.json() as { items?: ZernioAccount[] };
        const items: ConnectedItem[] = (data.items ?? []).map((a) => ({
          platform: a.platform, handle: a.handle ?? null, zernio_account_id: a.zernio_account_id,
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
      const auth = await requireTenantAuth(ctx, seg(ctx, "id", 2)); if (!auth.ok) return auth.error;
      const r = await deps.repo.listar(auth.value.tenantId as never);
      if (!r.ok) return { ok: false, error: { kind: "persistence_error" } };
      return { ok: true, channels: r.value };
    },
  };
}
