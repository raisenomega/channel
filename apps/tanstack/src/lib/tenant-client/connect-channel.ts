/**
 * HUB by Raisen — Wrappers para conectar canales via OAuth Meta/Zernio.
 */
export type Platform = "whatsapp" | "instagram" | "facebook";

export async function getConnectUrl(tenantId: string, platform: Platform): Promise<string> {
  const res = await fetch(`/api/tenants/${tenantId}/social-accounts/${platform}/connect-url`);
  if (!res.ok) throw new Error("Failed to get connect URL");
  const { url } = (await res.json()) as { url: string };
  return url;
}

export async function syncChannel(tenantId: string, platform: Platform): Promise<void> {
  const res = await fetch(`/api/tenants/${tenantId}/social-accounts/${platform}/zernio-sync`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Zernio sync failed");
}