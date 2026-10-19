/**
 * HUB by Raisen — Z-2: GET /tenants/:id/profile — perfil completo para precargar el overlay de
 * edición. requireTenantAuth(:id==claim) => 403 tenant_mismatch (anti cross-tenant). 200 con
 * { ok, profile }. El front descarta nulls/vacíos. Cero-mocks: dato real del tenant. C4 <=75.
 */
import type { RouteDefinition, RequestContext } from "../../server/server-types.ts";
import { requireTenantAuth, jsonResponse } from "../../server/auth-helpers.ts";
import { TenantId } from "../../shared/domain/ids.ts";
import { leerPerfilTenant } from "../infrastructure/tenant-profile.read.ts";

const seg = (ctx: RequestContext, k: string, i: number): string =>
  ctx.params[k] ?? (ctx.path.split("?")[0] ?? "").split("/")[i] ?? "";

export function rutaLeerPerfilTenant(): RouteDefinition {
  return {
    method: "GET",
    path: "/tenants/:id/profile",
    handler: async (ctx) => {
      const id = seg(ctx, "id", 2);
      const auth = await requireTenantAuth(ctx, id);
      if (!auth.ok) return auth.error;
      const r = await leerPerfilTenant(id as TenantId);
      if (!r.ok) return jsonResponse(500, { ok: false, error: r.error });
      return jsonResponse(200, { ok: true, profile: r.value ?? {} });
    },
  };
}
