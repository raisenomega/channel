/**
 * HUB by Raisen — Resolucion del tenant del usuario autenticado
 * Consulta `users` y `tenants` con el JWT del usuario (RLS por auth.uid()).
 * Sin dependencias externas; respeta la CSP.
 */
import { Result, err, ok } from "@shared/domain/result.ts";
import { auth, SessionUsuario } from "./auth-client.ts";

export interface TenantContext {
  readonly tenantId: string;
  readonly name: string;
  readonly plan: string;
  readonly slug: string;
}

export type TenantError =
  | { readonly kind: "config_incompleta" }
  | { readonly kind: "sin_tenant" }
  | { readonly kind: "no_autorizado" }
  | { readonly kind: "red"; readonly cause: string };

interface HubConfig {
  readonly supabaseUrl: string;
  readonly anonKey: string;
}

function config(): HubConfig {
  const g = globalThis as Record<string, unknown>;
  const cfg = g.__HUB_CONFIG__ as HubConfig | undefined;
  return { supabaseUrl: cfg?.supabaseUrl ?? "", anonKey: cfg?.anonKey ?? "" };
}

export async function resolverTenant(s: SessionUsuario): Promise<Result<TenantContext, TenantError>> {
  const { supabaseUrl, anonKey } = config();
  if (!supabaseUrl || !anonKey) return err({ kind: "config_incompleta" });
  try {
    // 1. Perfil del usuario: el RLS `users_read_own_tenant` permite leer la
    //    fila del usuario (id = auth.uid()).
    const perfil = await fetch(`${supabaseUrl}/rest/v1/users?select=tenant_id,email`, {
      headers: {
        apikey: anonKey,
        authorization: `Bearer ${s.accessToken}`,
        accept: "application/json",
      },
    });
    if (perfil.status === 401 || perfil.status === 403) return err({ kind: "no_autorizado" });
    const perfiles = (await perfil.json()) as Array<Record<string, unknown>>;
    const tenantId = perfiles[0]?.tenant_id as string | undefined;
    if (!tenantId) return err({ kind: "sin_tenant" });

    // 2. Datos del tenant: el RLS `tenants_read_own` permite leer el propio.
    const ten = await fetch(
      `${supabaseUrl}/rest/v1/tenants?select=id,name,slug,plan&id=eq.${encodeURIComponent(tenantId)}`,
      {
        headers: {
          apikey: anonKey,
          authorization: `Bearer ${s.accessToken}`,
          accept: "application/json",
        },
      },
    );
    if (ten.status === 401 || ten.status === 403) return err({ kind: "no_autorizado" });
    const tens = (await ten.json()) as Array<Record<string, unknown>>;
    const row = tens[0];
    if (!row) return err({ kind: "sin_tenant" });

    const context: TenantContext = Object.freeze({
      tenantId,
      name: (row.name as string) ?? "Mi empresa",
      plan: (row.plan as string) ?? "lite_starter",
      slug: (row.slug as string) ?? tenantId,
    });
    auth.guardar({ ...s, tenant: context });
    return ok(context);
  } catch (e) {
    return err({ kind: "red", cause: String(e) });
  }
}