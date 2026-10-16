/**
 * HUB by Raisen — Ruta HTTP: POST /tenants (crear tenant).
 */
import type { RouteDefinition, RequestContext } from "../../server/server-types.ts";
import { CrearTenantHandler } from "../application/create-tenant.handler.ts";
import { TenantRepositorySupabase } from "../infrastructure/tenant.repository.supabase.ts";

const repo = new TenantRepositorySupabase();
const handler = new CrearTenantHandler(repo);

export function rutaCrearTenant(): RouteDefinition {
  return {
    method: "POST", path: "/tenants",
    handler: async (ctx: RequestContext) => {
      const body = ctx.body as Record<string, unknown> ?? {};
      const name = (body["name"] as string) ?? "";
      const slug = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const email = (body["email"] as string) ?? "";
      const phone = (body["phone"] as string) ?? "";
      const primaryPhone = (body["primary_phone"] as string) ?? phone;
      if (!name || !email || !phone) {
        return { ok: false, error: { kind: "campos_incompletos" } };
      }
      const result = await handler.ejecutar({ name, slug, plan: "lite_starter", ownerEmail: email });
      if (!result.ok) return { ok: false, error: result.error };
      return { ok: true, id: result.value, name, email, phone, primary_phone: primaryPhone };
    },
  };
}