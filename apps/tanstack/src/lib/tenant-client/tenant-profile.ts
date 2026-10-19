/**
 * HUB by Raisen — Z-2: trae el perfil COMPLETO del tenant (GET /tenants/:id/profile) para precargar
 * el overlay de edición con TODOS los datos guardados (no solo el nombre). Cero-mocks: dato real;
 * null/vacíos se descartan (quedan en los defaults del form). C4 <=75.
 */
import { apiFetch } from "../api-client";
import type { OnboardingForm } from "./onboarding-fields";

export async function fetchTenantPerfil(tenantId: string): Promise<Partial<OnboardingForm> | null> {
  try {
    const res = await apiFetch(`/tenants/${tenantId}/profile`);
    if (!res.ok) return null;
    const body = (await res.json()) as { ok?: boolean; profile?: Record<string, unknown> };
    if (!body.ok || !body.profile) return null;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(body.profile)) {
      if (v !== null && v !== undefined && v !== "") out[k] = String(v);
    }
    return out as Partial<OnboardingForm>;
  } catch {
    return null;
  }
}
