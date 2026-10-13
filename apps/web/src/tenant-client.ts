/**
 * HUB by Raisen — Resolucion del tenant del usuario autenticado
 * Usa el RPC seguro `mi_tenant()` (SECURITY DEFINER) para evitar la recursion
 * de `current_tenant()` en el RLS de `users` al resolver post-login.
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
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/mi_tenant`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        authorization: `Bearer ${s.accessToken}`,
        "content-type": "application/json",
      },
      body: "{}",
    });
    if (res.status === 401 || res.status === 403) return err({ kind: "no_autorizado" });
    if (!res.ok) return err({ kind: "sin_tenant" });
    const filas = (await res.json()) as Array<Record<string, unknown>>;
    const fila = filas[0];
    if (!fila?.tenant_id) return err({ kind: "sin_tenant" });

    const context: TenantContext = Object.freeze({
      tenantId: String(fila.tenant_id),
      name: (fila.name as string) ?? "Mi empresa",
      plan: (fila.plan as string) ?? "lite_starter",
      slug: (fila.slug as string) ?? String(fila.tenant_id),
    });
    auth.guardar({ ...s, tenant: context });
    return ok(context);
  } catch (e) {
    return err({ kind: "red", cause: String(e) });
  }
}