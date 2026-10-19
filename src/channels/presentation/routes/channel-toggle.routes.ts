/**
 * HUB by Raisen — PATCH /tenants/:id/channels/:platform {connected} -> toggle conectado/desconectado.
 * El Switch de la card lo usa: apagar -> status='disconnected' (chip gris + reaparece Conectar);
 * encender -> status='connected' (el zernio_account_id persiste, NO exige re-OAuth). requireTenantAuth
 * (tenant del path == claim, Compuerta #17). El verde real lo confirma el refetch de /channels. C4 <=75.
 */
import type { RouteDefinition, RequestContext } from "../../../server/server-types.ts";
import { requireTenantAuth } from "../../../server/auth-helpers.ts";
import type { TenantId } from "../../../shared/domain/ids.ts";
import type { ChannelConnectionsRepo } from "../../infrastructure/channel-connections.repository.ts";

const seg = (ctx: RequestContext, k: string, i: number): string => ctx.params[k] ?? ctx.path.split("/")[i] ?? "";

export function rutaToggleCanal(repo: ChannelConnectionsRepo): RouteDefinition {
  return {
    method: "PATCH", path: "/tenants/:id/channels/:platform",
    handler: async (ctx: RequestContext) => {
      const auth = await requireTenantAuth(ctx, seg(ctx, "id", 2)); if (!auth.ok) return auth.error;
      const connected = ((ctx.body as { connected?: boolean } | null) ?? {}).connected === true;
      const r = await repo.actualizarEstado(auth.value.tenantId as TenantId, seg(ctx, "platform", 4), connected ? "connected" : "disconnected");
      if (!r.ok) return { ok: false, error: { kind: "persistence_error" } };
      return { ok: true, status: connected ? "connected" : "disconnected" };
    },
  };
}
