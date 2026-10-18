/**
 * HUB by Raisen — Cliente Zernio para OAuth connect + profiles (O-3/O-6, patron OMEGA).
 * Zernio NO tiene parametro `state` nativo: el state firmado se EMBEBE en redirectUrl
 * (?st=<HMAC>), que Zernio invoca verbatim al terminar OAuth. Base configurable por
 * ZERNIO_BASE_URL (default api.zernio.io, el que ya usa el resto de HUB). C4 <=75.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";

function base(): string {
  const d = (globalThis as Record<string, unknown>)["Deno"] as { env?: { get?(k: string): string | undefined } } | undefined;
  const p = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return (d?.env?.get ? d.env.get("ZERNIO_BASE_URL") : p?.env?.["ZERNIO_BASE_URL"]) ?? "https://api.zernio.io";
}

export type ZernioConnectError =
  | { readonly kind: "no_configurado" }
  | { readonly kind: "transporte"; readonly cause: string }
  | { readonly kind: "respuesta_invalida" };

// O-3: pide a Zernio el auth_url (headless) con el redirectUrl firmado embebido.
export async function fetchConnectUrl(apiKey: string, platform: string, profileId: string, redirectUrl: string): Promise<Result<{ authUrl: string }, ZernioConnectError>> {
  if (!apiKey) return err({ kind: "no_configurado" });
  const url = `${base()}/v1/connect/${encodeURIComponent(platform)}?profileId=${encodeURIComponent(profileId)}&headless=true&redirectUrl=${encodeURIComponent(redirectUrl)}`;
  try {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!r.ok) return err({ kind: "transporte", cause: `http_${r.status}` });
    const b = await r.json() as { auth_url?: string; authUrl?: string };
    const authUrl = b.auth_url ?? b.authUrl;
    return authUrl ? ok({ authUrl }) : err({ kind: "respuesta_invalida" });
  } catch (e) { return err({ kind: "transporte", cause: String(e) }); }
}

// O-6: crea (o adopta por 409) un profile Zernio por nombre. Devuelve el profileId.
export async function createProfile(apiKey: string, name: string): Promise<Result<{ profileId: string }, ZernioConnectError>> {
  if (!apiKey) return err({ kind: "no_configurado" });
  try {
    const r = await fetch(`${base()}/v1/profiles`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ name }),
    });
    if (r.status === 409) {
      // Duplicate name: adoptar el existente via GET ?name=.
      const g = await fetch(`${base()}/v1/profiles?name=${encodeURIComponent(name)}`, { headers: { Authorization: `Bearer ${apiKey}` } });
      if (!g.ok) return err({ kind: "transporte", cause: `http_${g.status}` });
      const arr = await g.json() as Array<{ id?: string; profile_id?: string }>;
      const id = Array.isArray(arr) && arr[0] ? (arr[0].id ?? arr[0].profile_id) : undefined;
      return id ? ok({ profileId: id }) : err({ kind: "respuesta_invalida" });
    }
    if (!r.ok) return err({ kind: "transporte", cause: `http_${r.status}` });
    const b = await r.json() as { id?: string; profile_id?: string };
    const id = b.id ?? b.profile_id;
    return id ? ok({ profileId: id }) : err({ kind: "respuesta_invalida" });
  } catch (e) { return err({ kind: "transporte", cause: String(e) }); }
}
