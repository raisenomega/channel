/**
 * HUB by Raisen — Onboarding de tenant (llama al RPC seguro)
 * Crea el tenant del usuario autenticado y lo deja como owner.
 */
import { Result, err, ok } from "../../../src/shared/domain/result.ts";
import type { SessionUsuario } from "./auth-client.ts";

export interface OnboardingData {
  readonly tenantName: string;
  readonly slug: string;
  readonly plan: string;
}

export type OnboardingError =
  | { readonly kind: "config_incompleta" }
  | { readonly kind: "no_autorizado" }
  | { readonly kind: "validacion"; readonly cause: string }
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

export async function crearTenant(s: SessionUsuario, d: OnboardingData): Promise<Result<string, OnboardingError>> {
  const { supabaseUrl, anonKey } = config();
  if (!supabaseUrl || !anonKey) return err({ kind: "config_incompleta" });
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/crear_tenant_onboarding`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        authorization: `Bearer ${s.accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ p_name: d.tenantName, p_slug: d.slug, p_plan: d.plan }),
    });
    if (res.status === 401 || res.status === 403) return err({ kind: "no_autorizado" });
    if (!res.ok) {
      const texto = await res.text();
      return err({ kind: "validacion", cause: texto.slice(0, 200) });
    }
    const tenantId = (await res.json()) as string;
    return ok(tenantId);
  } catch (e) {
    return err({ kind: "red", cause: String(e) });
  }
}