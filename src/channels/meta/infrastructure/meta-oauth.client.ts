/**
 * HUB by Raisen — Cliente HTTP OAuth Meta (WhatsApp Cloud API).
 * Fetch directo sin SDK. Usa System User Token.
 * C4 ≤75 lineas.
 */
import { Result, err, ok } from "../../../shared/domain/result.ts";
import type { ExchangeCodeResponse, MetaOAuthError } from "./meta-oauth.types.ts";

const META_GRAPH = "https://graph.facebook.com/v22.0";

function parsearBody(body: Record<string, unknown>): Result<ExchangeCodeResponse, MetaOAuthError> {
  if (body.error) {
    const e = body.error as Record<string, unknown>;
    return err({ kind: "meta_error", code: String(e.code ?? ""), message: String(e.message ?? "") });
  }
  const expiresIn = Number(body.access_token_expires_in ?? 0);
  const expiresAt = expiresIn > 0
    ? new Date(Date.now() + expiresIn * 1000).toISOString()
    : new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString();
  return ok({
    accessToken: String(body.access_token ?? ""),
    expiresAt,
    businessId: String(body.business_id ?? ""),
    accountId: String(body.account_id ?? ""),
  });
}

export async function intercambiarCodigo(
  code: string, appId: string, appSecret: string, redirectUri: string,
): Promise<Result<ExchangeCodeResponse, MetaOAuthError>> {
  const params = new URLSearchParams({ client_id: appId, client_secret: appSecret, redirect_uri: redirectUri, code });
  try {
    const res = await fetch(`${META_GRAPH}/oauth/access_token?${params.toString()}`, { method: "GET" });
    if (!res.ok) return err({ kind: "red", cause: `http_${res.status}` });
    return parsearBody((await res.json()) as Record<string, unknown>);
  } catch (e) {
    return err({ kind: "red", cause: String(e) });
  }
}

export async function refrescarToken(
  existingToken: string, appId: string, appSecret: string,
): Promise<Result<ExchangeCodeResponse, MetaOAuthError>> {
  const params = new URLSearchParams({ grant_type: "fb_exchange_token", client_id: appId, client_secret: appSecret, fb_exchange_token: existingToken });
  try {
    const res = await fetch(`${META_GRAPH}/oauth/access_token?${params.toString()}`, { method: "GET" });
    if (!res.ok) return err({ kind: "red", cause: `http_${res.status}` });
    return parsearBody((await res.json()) as Record<string, unknown>);
  } catch (e) {
    return err({ kind: "red", cause: String(e) });
  }
}