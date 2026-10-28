/**
 * HUB by Raisen — Baja un media de Zernio (exige Bearer API key, no publico) y lo devuelve en base64
 * para pasarlo al LLM con vision. Mismo mecanismo que el media-proxy del frontend. Fail-safe: null si
 * no hay llave/url o falla la descarga (nunca rompe la respuesta del agente). C4 <=75. Sin any.
 */
import { getEnv } from "../../shared/infrastructure/supabase-rest.helper.ts";

export async function bajarImagenBase64(url: string, mime: string): Promise<{ mediaType: string; dataBase64: string } | null> {
  const key = getEnv("ZERNIO_API_KEY") ?? "";
  if (!url || !key) return null;
  try {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
    if (!r.ok) return null;
    const bytes = new Uint8Array(await r.arrayBuffer());
    let bin = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
    return { mediaType: mime || r.headers.get("content-type") || "image/jpeg", dataBase64: btoa(bin) };
  } catch {
    return null;
  }
}
