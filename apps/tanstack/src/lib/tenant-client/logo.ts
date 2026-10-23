/**
 * HUB by Raisen — Logo del negocio: subida + guardado DIRECTO a Supabase (NO depende de Railway).
 * Sube al bucket `tenant-logos` (user JWT) y hace merge de la URL en tenants.branding_config.logo_url
 * (RLS tenants_update_own). Lectura = branding_config.logo_url. Cero-mocks. C4 <=75.
 */
import { supabaseAuthHeaders, supabaseRestBase, getSupabaseUrl } from "../supabase";
import { validateUpload, safeExt } from "@/lib/upload-guard";

const BUCKET = "tenant-logos";

export async function fetchLogoUrl(tenantId: string): Promise<string | null> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers || !tenantId) return null;
  try {
    const res = await fetch(`${base}/tenants?id=eq.${encodeURIComponent(tenantId)}&select=branding_config`, { headers });
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<{ branding_config?: { logo_url?: string } | null }>;
    return rows[0]?.branding_config?.logo_url ?? null;
  } catch {
    return null;
  }
}

export async function uploadLogo(tenantId: string, file: File): Promise<string | null> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  const url = getSupabaseUrl();
  if (!base || !headers || !url || !tenantId) return null;
  if (!validateUpload(file, "image").ok) return null;
  const ext = safeExt(file.type);
  const path = `${encodeURIComponent(tenantId)}/logo.${ext}`;
  try {
    const up = await fetch(`${url}/storage/v1/object/${BUCKET}/${path}`, {
      method: "POST",
      headers: { ...headers, "content-type": file.type, "x-upsert": "true" },
      body: file,
    });
    if (!up.ok) return null;
    const publicUrl = `${url}/storage/v1/object/public/${BUCKET}/${path}?v=${Date.now()}`;
    const cur = await fetch(`${base}/tenants?id=eq.${encodeURIComponent(tenantId)}&select=branding_config`, { headers });
    const rows = cur.ok ? ((await cur.json()) as Array<{ branding_config?: Record<string, unknown> | null }>) : [];
    const branding = { ...(rows[0]?.branding_config ?? {}), logo_url: publicUrl };
    await fetch(`${base}/tenants?id=eq.${encodeURIComponent(tenantId)}`, {
      method: "PATCH",
      headers: { ...headers, "content-type": "application/json", prefer: "return=minimal" },
      body: JSON.stringify({ branding_config: branding }),
    });
    return publicUrl;
  } catch {
    return null;
  }
}
