/**
 * HUB by Raisen — Proxy de media: el adjunto de Zernio exige Bearer API key (no cargable desde el
 * navegador). Este endpoint (JWT + tenant-scoped) baja el media con la llave y lo devuelve como data
 * URL base64 (el server solo responde string). GET /tenants/:tenantId/media/:messageId. C4 <=75.
 */
import type { RouteDefinition } from "./server-types.ts";
import { requireTenantAuth, jsonResponse } from "./auth-helpers.ts";
import { supabaseBase, supabaseHdrs } from "../shared/infrastructure/supabase-rest.helper.ts";
import { ZernioCredentialsRepository } from "../channels/infrastructure/zernio.credentials.ts";

function toBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(bin);
}

async function leerMedia(tenantId: string, messageId: string): Promise<{ url: string; mime: string } | null> {
  const base = supabaseBase();
  const hdrs = supabaseHdrs();
  if (!base || !hdrs) return null;
  const q = `${base}/messages?select=media_url,media_mime&id=eq.${encodeURIComponent(messageId)}&tenant_id=eq.${encodeURIComponent(tenantId)}&limit=1`;
  try {
    const r = await fetch(q, { headers: hdrs });
    if (!r.ok) return null;
    const rows = (await r.json()) as Array<{ media_url: string | null; media_mime: string | null }>;
    const row = rows[0];
    return row?.media_url ? { url: row.media_url, mime: row.media_mime ?? "" } : null;
  } catch { return null; }
}

export function rutaMediaProxy(): RouteDefinition {
  return {
    method: "GET", path: "/tenants/:tenantId/media/:messageId",
    handler: async (ctx) => {
      const auth = await requireTenantAuth(ctx, ctx.params.tenantId);
      if (!auth.ok) return auth.error;
      const media = await leerMedia(auth.value.tenantId, ctx.params.messageId ?? "");
      if (!media) return jsonResponse(404, { ok: false, error: { kind: "media_no_encontrada" } });
      const creds = await new ZernioCredentialsRepository().leer();
      if (!creds.ok) return jsonResponse(500, { ok: false, error: { kind: "zernio_sin_credenciales" } });
      try {
        const r = await fetch(media.url, { headers: { Authorization: `Bearer ${creds.value.apiKey}` } });
        if (!r.ok) return jsonResponse(502, { ok: false, error: { kind: "zernio_media_error" } });
        const bytes = new Uint8Array(await r.arrayBuffer());
        const mime = media.mime || r.headers.get("content-type") || "application/octet-stream";
        return jsonResponse(200, { ok: true, dataUrl: `data:${mime};base64,${toBase64(bytes)}` });
      } catch (e) {
        return jsonResponse(502, { ok: false, error: { kind: "proxy_fetch_fail", cause: String(e) } });
      }
    },
  };
}
