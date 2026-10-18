/**
 * HUB by Raisen — Ruta HTTP: POST /tenants (crear tenant). JWT obligatorio (Compuerta #17).
 * Hotfix G: requireUserAuth (JWT valido SIN exigir tenant_id: el usuario aun no tiene tenant).
 * 401 sin JWT · 400 body incompleto/invalido · 409 duplicado o tenant_ya_existe · 500 persistencia · 201 creado.
 */
import type { RouteDefinition, RequestContext } from "../../server/server-types.ts";
import { jsonResponse, requireUserAuth } from "../../server/auth-helpers.ts";
import { CrearTenantHandler } from "../application/create-tenant.handler.ts";
import { TenantRepositorySupabase } from "../infrastructure/tenant.repository.supabase.ts";
import { UserRepositorySupabase } from "../infrastructure/user.repository.supabase.ts";
import { OwnerClaimsLinkerSupabase } from "../infrastructure/owner-claims.linker.supabase.ts";

const handler = new CrearTenantHandler(
  new TenantRepositorySupabase(),
  new UserRepositorySupabase(),
  new OwnerClaimsLinkerSupabase(),
);

function statusDeError(kind: string): number {
  if (kind === "persistence_failure" || kind === "owner_link_failed") return 500;
  if (kind === "slug_ya_existe" || kind === "duplicado" || kind === "tenant_ya_existe") return 409;
  return 400;
}

export function rutaCrearTenant(): RouteDefinition {
  return {
    method: "POST", path: "/tenants",
    handler: async (ctx: RequestContext) => {
      const auth = await requireUserAuth(ctx);
      if (!auth.ok) return auth.error;
      const body = (ctx.body as Record<string, unknown> | null) ?? {};
      const name = String(body["name"] ?? "").trim();
      const email = String(body["email"] ?? "").trim();
      const phone = String(body["phone"] ?? "").trim();
      const primaryPhone = String(body["primary_phone"] ?? phone).trim();
      const countryCode = String(body["country_code"] ?? "PR").trim();
      const timezone = String(body["timezone"] ?? "America/Puerto_Rico").trim();
      const defaultLanguage = String(body["default_language"] ?? "es").trim();
      const plan = String(body["plan"] ?? "esencial").trim();
      if (!name || !email || !phone) {
        return jsonResponse(400, { ok: false, error: { kind: "campos_incompletos" } });
      }
      const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const result = await handler.ejecutar({
        name, slug, plan: plan as never, ownerEmail: email, ownerUserId: auth.value.userId,
        language: defaultLanguage as never,
        countryCode: countryCode,
        timezone: timezone,
        phone: phone,
      });
      if (!result.ok) return jsonResponse(statusDeError(result.error.kind), { ok: false, error: result.error });
      return jsonResponse(201, { ok: true, id: result.value, name, email, phone, primary_phone: primaryPhone });
    },
  };
}
