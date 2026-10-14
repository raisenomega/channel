/**
 * HUB by Raisen — Cliente HTTP para la API OAuth de Meta (WhatsApp Cloud API).
 * Fetch directo sin SDK. Solo consume System User Token, no page_access_token.
 * C4 ≤75 líneas.
 */
import { Result, err, ok } from "../../../shared/domain/result.ts";

const META_GRAPH_URL = "https://graph.facebook.com/v22.0";

export interface ExchangeCodeResponse {
  readonly accessToken: string;
  readonly expiresAt: string;
  readonly businessId: string;
  readonly accountId: string;
}

export type MetaOAuthError =
  | { readonly kind: "red"; readonly cause: string }
  | { readonly kind: "meta_error"; readonly code: string; readonly message: string };

export async function intercambiarCodigo(
  code: string,
  appId: string,
  appSecret: string,
  redirectUri: string,
): Promise<Result<ExchangeCodeResponse, MetaOAuthError>> {
  const url = `${META_GRAPH_URL}/oauth/access_token`;
  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  });
  try {
    const res = await fetch(`${url}?${params.toString()}`, { method: "GET" });
    if (!res.ok) return err({ kind: "red", cause: `http_${res.status}` });
    const body = (await res.json()) as Record<string, unknown>;

    if (body.error) {
      const e = body.error as Record<string, unknown>;
      return err({ kind: "meta_error", code: String(e.code ?? ""), message: String(e.message ?? "") });
    }

    const expiresIn = Number(body.access_token_expires_in ?? 0);
    const expiresAt = expiresIn > 0
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString(); // fallback 60 días

    return ok({
      accessToken: String(body.access_token ?? ""),
      expiresAt,
      businessId: String(body.business_id ?? ""),
      accountId: String(body.account_id ?? ""),
    });
  } catch (e) {
    return err({ kind: "red", cause: String(e) });
  }
}

export async function refrescarToken(
  existingToken: string,
  appId: string,
  appSecret: string,
): Promise<Result<ExchangeCodeResponse, MetaOAuthError>> {
  const url = `${META_GRAPH_URL}/oauth/access_token`;
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: existingToken,
  });
  try {
    const res = await fetch(`${url}?${params.toString()}`, { method: "GET" });
    if (!res.ok) return err({ kind: "red", cause: `http_${res.status}` });

    const body = (await res.json()) as Record<string, unknown>;
    if (body.error) {
      const e = body.error as Record<string, unknown>;
      return err({ kind: "meta_error", code: String(e.code ?? ""), message: String(e.message ?? "") });
    }
    const expiresIn = Number(body.access_token_expires_in ?? 0);
    const expiresAt = expiresIn > 0
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString();

    return ok({
      accessToken: String(body.access_token ?? existingToken),
      expiresAt,
      businessId: String(body.business_id ?? ""),
      accountId: String(body.account_id ?? ""),
    });
  } catch (e) {
    return err({ kind: "red", cause: String(e) });
  }
}