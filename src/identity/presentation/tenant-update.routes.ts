/**
 * HUB by Raisen — R-3/R-4: PATCH /tenants/:id — editar el telefono del tenant (edit-number).
 * requireTenantAuth(ctx, :id) => 403 tenant_mismatch si :id != session.tenantId (anti cross-tenant).
 * Valida phone E.164. NO cambia el scope de sesion (solo UPDATE tenants.phone). 404 si no existe.
 * El backend usa service-role (RLS bypaseada) => el guard de app (:id==claim) es la defensa. C4 <=75.
 */
import type { RouteDefinition, RequestContext } from "../../server/server-types.ts";
import { requireTenantAuth, jsonResponse } from "../../server/auth-helpers.ts";
import { esTelefonoE164 } from "../domain/tenant.entity.ts";
import type { TenantState } from "../domain/tenant.entity.ts";
import type { TenantId } from "../../shared/domain/ids.ts";
import type { Result } from "../../shared/domain/result.ts";

export interface TenantUpdateDeps {
  readonly buscar: (id: TenantId) => Promise<Result<TenantState | null, { readonly kind: string }>>;
  readonly actualizarTelefono: (id: TenantId, phone: string) => Promise<Result<void, { readonly kind: string }>>;
}

const seg = (ctx: RequestContext, k: string, i: number): string => ctx.params[k] ?? (ctx.path.split("?")[0] ?? "").split("/")[i] ?? "";

export function rutaActualizarTenant(deps: TenantUpdateDeps): RouteDefinition {
  return {
    method: "PATCH", path: "/tenants/:id",
    handler: async (ctx) => {
      const id = seg(ctx, "id", 2);
      const auth = await requireTenantAuth(ctx, id); // 403 si id != session.tenantId (scope anchor)
      if (!auth.ok) return auth.error;
      const body = (ctx.body as Record<string, unknown> | null) ?? {};
      const phone = String(body["phone"] ?? "").trim();
      if (!esTelefonoE164(phone)) return jsonResponse(400, { ok: false, error: { kind: "telefono_invalido" } });
      const existente = await deps.buscar(id as TenantId);
      if (!existente.ok) return jsonResponse(500, { ok: false, error: existente.error });
      if (!existente.value) return jsonResponse(404, { ok: false, error: { kind: "tenant_not_found" } });
      const upd = await deps.actualizarTelefono(id as TenantId, phone);
      if (!upd.ok) return jsonResponse(500, { ok: false, error: upd.error });
      // R-4: respuesta minima; NO re-emite token/session/tenant (scope de sesion intacto).
      return jsonResponse(200, { ok: true, id, phone });
    },
  };
}
