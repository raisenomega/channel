/**
 * HUB by Raisen — Wrapper para POST /tenants (Hotfix G: via apiFetch con JWT).
 * Tras crear: recuerda el tenant y refresca la sesion para que el nuevo JWT traiga
 * app_metadata.tenant_id (lo escribe el backend). Sin eso las rutas /tenants/:id dan 401.
 */
import { apiFetch, rememberTenantId } from "../api-client";
import { readLocalSession, writeLocalSession } from "../auth";
import { getSupabase } from "../supabase";
import type { Perfil } from "./onboarding-fields";

/** S-2: ademas de name/email/phone, puede traer cualquier campo de perfil (snake_case) opcional. */
export type CreateTenantInput = { name: string; email: string; phone: string; primary_phone?: string } & Partial<Perfil>;

export interface CreateTenantResult {
  readonly id: string;
  readonly name: string;
}

async function refrescarSesion(): Promise<void> {
  const sb = getSupabase();
  const actual = readLocalSession();
  if (!sb || !actual?.refresh_token) return;
  const { data } = await sb.auth.refreshSession({ refresh_token: actual.refresh_token });
  if (data.session) writeLocalSession(data.session);
}

export async function createTenant(input: CreateTenantInput): Promise<CreateTenantResult> {
  const res = await apiFetch("/tenants", {
    method: "POST",
    body: JSON.stringify({ ...input, primary_phone: input.primary_phone ?? input.phone }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `POST /tenants failed (${res.status})`);
  }
  const creado = (await res.json()) as CreateTenantResult;
  rememberTenantId(creado.id);
  await refrescarSesion();
  return creado;
}
