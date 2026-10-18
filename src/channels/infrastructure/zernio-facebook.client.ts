/**
 * HUB by Raisen — O-4: page-selection de Facebook via Zernio (contrato OMEGA verificado).
 * Tras el OAuth FB, Zernio devuelve step=select_page + tempToken + connect_token: se LISTAN las
 * paginas del consent y se SELECCIONA una para adjuntarla al profile. connect_token -> header
 * X-Connect-Token; tempToken -> query. Path unico GET lista / POST elige. Cero-fabricacion. C4 <=75.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";

function base(): string {
  const d = (globalThis as Record<string, unknown>)["Deno"] as { env?: { get?(k: string): string | undefined } } | undefined;
  const p = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return (d?.env?.get ? d.env.get("ZERNIO_BASE_URL") : p?.env?.["ZERNIO_BASE_URL"]) ?? "https://zernio.com/api/v1";
}
const PATH = "/connect/facebook/select-page";
export type FbError = { readonly kind: "transporte"; readonly cause: string } | { readonly kind: "respuesta_invalida" };
export interface FbPage { readonly id: string; readonly name: string; }

function hdrs(apiKey: string, connectToken: string): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` };
  if (connectToken) h["X-Connect-Token"] = connectToken;
  return h;
}

export async function getFacebookPages(apiKey: string, connectToken: string, tempToken: string, profileId: string): Promise<Result<readonly FbPage[], FbError>> {
  try {
    const q = `?profileId=${encodeURIComponent(profileId)}&tempToken=${encodeURIComponent(tempToken)}`;
    const r = await fetch(`${base()}${PATH}${q}`, { headers: hdrs(apiKey, connectToken) });
    if (!r.ok) return err({ kind: "transporte", cause: `http_${r.status}` });
    const pages = (await r.json() as { pages?: Array<{ id?: string; name?: string }> }).pages ?? [];
    return ok(pages.filter((p) => p.id).map((p) => ({ id: String(p.id), name: String(p.name ?? p.id) })));
  } catch (e) { return err({ kind: "transporte", cause: String(e) }); }
}

export async function selectFacebookPage(apiKey: string, connectToken: string, tempToken: string, pageId: string, profileId: string, userProfile: unknown): Promise<Result<{ accountId: string }, FbError>> {
  try {
    const r = await fetch(`${base()}${PATH}`, { method: "POST", headers: hdrs(apiKey, connectToken), body: JSON.stringify({ profileId, tempToken, pageId, userProfile }) });
    if (r.status !== 200 && r.status !== 201) return err({ kind: "transporte", cause: `http_${r.status}` });
    const aid = (await r.json() as { account?: { accountId?: string } }).account?.accountId;
    return aid ? ok({ accountId: String(aid) }) : err({ kind: "respuesta_invalida" });
  } catch (e) { return err({ kind: "transporte", cause: String(e) }); }
}
