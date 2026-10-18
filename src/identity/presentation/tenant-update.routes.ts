/**
 * HUB by Raisen — R-3/R-4 + S-10: PATCH /tenants/:id — editar datos del negocio (number + perfil).
 * requireTenantAuth(ctx, :id) => 403 tenant_mismatch si :id != session.tenantId (anti cross-tenant).
 * phone (si viene) valida E.164. name + perfil (sanitizado) se actualizan si vienen. NO cambia el
 * scope de sesion. 404 si no existe. Guard de app (:id==claim) = defensa (service-role). C4 <=75.
 */
import type { RouteDefinition, RequestContext } from "../../server/server-types.ts";
import { requireTenantAuth, jsonResponse } from "../../server/auth-helpers.ts";
import { esTelefonoE164 } from "../domain/tenant.entity.ts";
import { sanitizarPerfil } from "../domain/tenant-profile.ts";
import type { TenantState } from "../domain/tenant.entity.ts";
import type { TenantId } from "../../shared/domain/ids.ts";
import type { Result } from "../../shared/domain/result.ts";

type RepoR = Result<void, { readonly kind: string }>;
export interface TenantUpdateDeps {
  readonly buscar: (id: TenantId) => Promise<Result<TenantState | null, { readonly kind: string }>>;
  readonly actualizarTelefono: (id: TenantId, phone: string) => Promise<RepoR>;
  /** S-10: UPDATE de columnas de perfil (name + datos fisicos/fiscales/brand voice). Opcional. */
  readonly actualizarPerfil?: (id: TenantId, cols: Record<string, unknown>) => Promise<RepoR>;
}

const seg = (ctx: RequestContext, k: string, i: number): string => ctx.params[k] ?? (ctx.path.split("?")[0] ?? "").split("/")[i] ?? "";

function columnasEdit(body: Record<string, unknown>): Record<string, unknown> {
  const cols = sanitizarPerfil(body);
  const name = String(body["name"] ?? "").trim();
  if (name) cols["name"] = name;
  return cols;
}

export function rutaActualizarTenant(deps: TenantUpdateDeps): RouteDefinition {
  return {
    method: "PATCH", path: "/tenants/:id",
    handler: async (ctx) => {
      const id = seg(ctx, "id", 2);
      const auth = await requireTenantAuth(ctx, id); // 403 si id != session.tenantId (scope anchor)
      if (!auth.ok) return auth.error;
      const body = (ctx.body as Record<string, unknown> | null) ?? {};
      const tienePhone = body["phone"] !== undefined;
      const phone = String(body["phone"] ?? "").trim();
      if (tienePhone && !esTelefonoE164(phone)) return jsonResponse(400, { ok: false, error: { kind: "telefono_invalido" } });
      const existente = await deps.buscar(id as TenantId);
      if (!existente.ok) return jsonResponse(500, { ok: false, error: existente.error });
      if (!existente.value) return jsonResponse(404, { ok: false, error: { kind: "tenant_not_found" } });
      if (tienePhone) {
        const upd = await deps.actualizarTelefono(id as TenantId, phone);
        if (!upd.ok) return jsonResponse(500, { ok: false, error: upd.error });
      }
      const cols = columnasEdit(body);
      if (Object.keys(cols).length > 0 && deps.actualizarPerfil) {
        const up2 = await deps.actualizarPerfil(id as TenantId, cols);
        if (!up2.ok) return jsonResponse(500, { ok: false, error: up2.error });
      }
      // R-4: respuesta minima; NO re-emite token/session/tenant (scope de sesion intacto).
      return jsonResponse(200, { ok: true, id, phone });
    },
  };
}
