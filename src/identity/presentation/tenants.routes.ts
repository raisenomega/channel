/**
 * HUB by Raisen — Ruta HTTP: POST /tenants (crear tenant). JWT obligatorio (Compuerta #17).
 * 401 sin JWT · 400 body incompleto o invalido · 409 duplicado · 500 persistencia · 201 creado.
 */
import type { RouteDefinition, RequestContext } from "../../server/server-types.ts";
import { jsonResponse, requireTenantAuth } from "../../server/auth-helpers.ts";
import { CrearTenantHandler } from "../application/create-tenant.handler.ts";
import { TenantRepositorySupabase } from "../infrastructure/tenant.repository.supabase.ts";

const repo = new TenantRepositorySupabase();
const handler = new CrearTenantHandler(repo);

function statusDeError(kind: string): number {
  if (kind === "persistence_failure") return 500;
  if (kind === "slug_ya_existe" || kind === "duplicado") return 409;
  return 400;
}

export function rutaCrearTenant(): RouteDefinition {
  return {
    method: "POST", path: "/tenants",
    handler: async (ctx: RequestContext) => {
      const auth = await requireTenantAuth(ctx);
      if (!auth.ok) return auth.error;
      const body = (ctx.body as Record<string, unknown> | null) ?? {};
      const name = String(body["name"] ?? "").trim();
      const email = String(body["email"] ?? "").trim();
      const phone = String(body["phone"] ?? "").trim();
      const primaryPhone = String(body["primary_phone"] ?? phone).trim();
      if (!name || !email || !phone) {
        return jsonResponse(400, { ok: false, error: { kind: "campos_incompletos" } });
      }
      const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const result = await handler.ejecutar({
        name, slug, plan: "lite_starter", ownerEmail: email, ownerUserId: auth.value.userId,
      });
      if (!result.ok) return jsonResponse(statusDeError(result.error.kind), { ok: false, error: result.error });
      return jsonResponse(201, { ok: true, id: result.value, name, email, phone, primary_phone: primaryPhone });
    },
  };
}
