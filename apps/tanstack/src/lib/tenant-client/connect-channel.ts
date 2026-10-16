/**
 * HUB by Raisen — Wrappers para conectar canales via OAuth Meta/Zernio (Hotfix G: apiFetch + JWT).
 */
import { apiFetch } from "../api-client";

export type Platform = "whatsapp" | "instagram" | "facebook";

export async function getConnectUrl(tenantId: string, platform: Platform): Promise<string> {
  const res = await apiFetch(`/tenants/${encodeURIComponent(tenantId)}/social-accounts/${platform}/connect-url`);
  if (!res.ok) throw new Error(`Failed to get connect URL (${res.status})`);
  const data = (await res.json()) as { ok?: boolean; auth_url?: string };
  if (!data.auth_url) throw new Error("connect URL ausente en la respuesta");
  return data.auth_url;
}

export async function syncChannel(tenantId: string, platform: Platform): Promise<void> {
  const res = await apiFetch(`/tenants/${encodeURIComponent(tenantId)}/social-accounts/${platform}/zernio-sync`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Zernio sync failed (${res.status})`);
}
