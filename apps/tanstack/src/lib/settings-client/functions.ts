/**
 * HUB by Raisen — Funciones del cliente de settings.
 */
import type { RestRes } from "../supabase";
import { restGet, restPatch } from "../supabase";
import type { Result, PrivacyConfig, ConsentLogEntry } from "./types";

function toResult<T>(fn: () => Promise<T>): Promise<Result<T, Error>> {
  return fn().then(
    (value) => ({ ok: true as const, value }),
    (error: unknown) => ({ ok: false as const, error: error instanceof Error ? error : new Error(String(error)) }),
  );
}

function unwrapError<T>(res: RestRes<T>): Error {
  const err = res as Extract<RestRes<T>, { ok: false }>;
  return new Error(err.cause ?? `Error Supabase: ${err.kind}`);
}

export async function getPrivacyConfig(): Promise<Result<PrivacyConfig, Error>> {
  const res = await restGet<PrivacyConfig>("privacy_config", "ai_disclosure_accepted,ai_disclosure_accepted_at,privacy_policy_version,tos_version,data_retention_days,updated_at");
  if (!res.ok) return { ok: false, error: unwrapError(res) };
  const row = res.value[0];
  if (!row) {
    return {
      ok: true,
      value: Object.freeze({
        ai_disclosure_accepted: false,
        ai_disclosure_accepted_at: null,
        privacy_policy_version: null,
        tos_version: null,
        data_retention_days: null,
        updated_at: null,
      }),
    };
  }
  return { ok: true, value: row };
}

export async function getConsentLog(): Promise<Result<ConsentLogEntry[], Error>> {
  return toResult(async () => {
    const res = await restGet<ConsentLogEntry>("consent_log", "id,contact_id,consent_type,granted,granted_at,source", {
      headers: { prefer: "count=exact" },
    });
    if (!res.ok) {
      throw unwrapError(res);
    }
    return res.value ?? [];
  });
}

export async function optInAI(accepted: boolean): Promise<Result<void, Error>> {
  return toResult(async () => {
    const res = await restPatch<unknown>("privacy_config", {
      ai_disclosure_accepted: accepted,
      ai_disclosure_accepted_at: accepted ? new Date().toISOString() : null,
    });
    if (!res.ok) {
      throw unwrapError(res);
    }
  });
}