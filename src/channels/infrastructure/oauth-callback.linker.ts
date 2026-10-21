/**
 * HUB by Raisen — Orquesta el callback OAuth de Zernio (Hotfix H-1).
 * Llama a Zernio /v1/oauth/callback y persiste accountId en channel_connections.
 * Result<T,E> en toda la cadena. C4 <=75.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";
import type { TenantId } from "../../shared/domain/ids.ts";
import type { SocialPlatform } from "../domain/social-account.entity.ts";

const ACCOUNT_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

interface ZernioCallbackResponse { accountId?: string; status?: string; }

export type LinkerError =
  | { readonly kind: "zernio_callback_failed"; readonly cause: string }
  | { readonly kind: "zernio_response_invalid" }
  | { readonly kind: "account_id_hostil" }
  | { readonly kind: "persistence_error" };

export interface LinkerResult { readonly zernioAccountId: string; }

export async function ejecutarOAuthLink(
  code: string,
  state: string,
  zernioApiKey: string,
  upsert: (tenantId: TenantId, platform: SocialPlatform, zernioAccountId: string) => Promise<Result<void, string>>,
): Promise<Result<LinkerResult, LinkerError>> {
  if (!zernioApiKey) return err({ kind: "zernio_callback_failed", cause: "api_key_no_configurada" });
  try {
    const r = await fetch("https://zernio.com/api/v1/oauth/callback", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${zernioApiKey}` },
      body: JSON.stringify({ code, state }),
    });
    if (!r.ok) return err({ kind: "zernio_callback_failed", cause: `http_${r.status}` });
    const body = await r.json() as ZernioCallbackResponse;
    if (!body.accountId || typeof body.accountId !== "string") return err({ kind: "zernio_response_invalid" });
    if (!ACCOUNT_ID_RE.test(body.accountId)) return err({ kind: "account_id_hostil" });
    const parts = state.split(":");
    const tenantId = parts[0] ?? "";
    const platform = parts[1] ?? "";
    const persist = await upsert(tenantId as TenantId, platform as SocialPlatform, body.accountId);
    if (!persist.ok) return err({ kind: "persistence_error" });
    return ok({ zernioAccountId: body.accountId });
  } catch { return err({ kind: "zernio_callback_failed", cause: "network_error" }); }
}