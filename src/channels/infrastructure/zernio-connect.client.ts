/**
 * HUB by Raisen — Cliente Zernio OAuth connect + profiles (O-3/O-6, contrato VERIFICADO vs
 * OMEGA en vivo). Zernio no tiene `state` nativo: el state firmado va embebido en redirectUrl.
 * Base por ZERNIO_BASE_URL (default https://zernio.com/api/v1); paths {base}/connect, /profiles,
 * /accounts (SIN /v1 extra). Respuestas reales: connect {authUrl} · create {profile:{_id}} ·
 * list profiles {profiles:[{name,_id}]} · accounts {accounts:[{_id,platform,username,profileId}]}. C4 <=75.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";

function base(): string {
  const d = (globalThis as Record<string, unknown>)["Deno"] as { env?: { get?(k: string): string | undefined } } | undefined;
  const p = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return (d?.env?.get ? d.env.get("ZERNIO_BASE_URL") : p?.env?.["ZERNIO_BASE_URL"]) ?? "https://zernio.com/api/v1";
}

export type ZernioConnectError =
  | { readonly kind: "no_configurado" }
  | { readonly kind: "transporte"; readonly cause: string }
  | { readonly kind: "respuesta_invalida" };

export interface ZernioAccountLite { readonly id: string; readonly platform: string; readonly handle: string | null; readonly profileId: string | null; }

async function getJson(apiKey: string, path: string): Promise<Result<unknown, ZernioConnectError>> {
  try {
    const r = await fetch(`${base()}${path}`, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!r.ok) return err({ kind: "transporte", cause: `http_${r.status}` });
    return ok(await r.json());
  } catch (e) { return err({ kind: "transporte", cause: String(e) }); }
}

export async function fetchConnectUrl(apiKey: string, platform: string, profileId: string, redirectUrl: string): Promise<Result<{ authUrl: string }, ZernioConnectError>> {
  if (!apiKey) return err({ kind: "no_configurado" });
  const r = await getJson(apiKey, `/connect/${encodeURIComponent(platform)}?profileId=${encodeURIComponent(profileId)}&headless=true&redirectUrl=${encodeURIComponent(redirectUrl)}`);
  if (!r.ok) return err(r.error);
  const authUrl = (r.value as { authUrl?: string; auth_url?: string }).authUrl ?? (r.value as { auth_url?: string }).auth_url;
  return authUrl ? ok({ authUrl }) : err({ kind: "respuesta_invalida" });
}

export async function createProfile(apiKey: string, name: string): Promise<Result<{ profileId: string }, ZernioConnectError>> {
  if (!apiKey) return err({ kind: "no_configurado" });
  try {
    const r = await fetch(`${base()}/profiles`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ name, description: "" }) });
    if (r.status !== 200 && r.status !== 201) return err({ kind: "transporte", cause: `http_${r.status}` });
    const pid = ((await r.json() as { profile?: { _id?: string } }).profile ?? {})._id;
    return pid ? ok({ profileId: String(pid) }) : err({ kind: "respuesta_invalida" });
  } catch (e) { return err({ kind: "transporte", cause: String(e) }); }
}

export async function findProfileByName(apiKey: string, name: string): Promise<Result<string | null, ZernioConnectError>> {
  const r = await getJson(apiKey, `/profiles`);
  if (!r.ok) return err(r.error);
  const arr = (r.value as { profiles?: Array<{ name?: string; _id?: string }> }).profiles ?? (Array.isArray(r.value) ? r.value as Array<{ name?: string; _id?: string }> : []);
  const found = arr.find((p) => p.name === name && p._id);
  return ok(found?._id ? String(found._id) : null);
}

export async function listOwnAccounts(apiKey: string, profileId: string): Promise<ReadonlyArray<ZernioAccountLite>> {
  if (!apiKey || !profileId) return [];
  const r = await getJson(apiKey, `/accounts?profileId=${encodeURIComponent(profileId)}`);
  if (!r.ok) return [];
  const arr = (r.value as { accounts?: Array<Record<string, unknown>> }).accounts ?? [];
  return arr.filter((a) => a["_id"]).map((a) => {
    const p = a["profileId"]; const pid = (p && typeof p === "object") ? (p as { _id?: string })._id : p;
    return { id: String(a["_id"]), platform: String(a["platform"] ?? ""), handle: (a["username"] ?? a["displayName"] ?? null) as string | null, profileId: pid ? String(pid) : null };
  }).filter((a) => a.profileId === profileId);
}
