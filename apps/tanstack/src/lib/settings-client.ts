/**
 * HUB by Raisen — Cliente para configuración de privacidad y consentimiento.
 * Datos reales desde Supabase REST (privacy_config, consent_log). Sin datos mock (N5).
 */
import type { RestRes } from "./supabase";
import { restGet, restPatch } from "./supabase";

// ── Tipos ────────────────────────────────────────────────────

export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export interface PrivacyConfig {
  readonly ai_disclosure_accepted: boolean;
  readonly ai_disclosure_accepted_at: string | null;
  readonly privacy_policy_version: string | null;
  readonly tos_version: string | null;
  readonly data_retention_days: number | null;
  readonly updated_at: string | null;
}

export interface ConsentLogEntry {
  readonly id: string;
  readonly contact_id: string;
  readonly consent_type: string;
  readonly granted: boolean;
  readonly granted_at: string;
  readonly source: string | null;
}

// ── Helpers ──────────────────────────────────────────────────

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

// ── Consultas ────────────────────────────────────────────────

/**
 * Obtiene la configuración de privacidad del tenant desde `privacy_config`.
 * Retorna el primer registro (se asume uno por tenant).
 */
export async function getPrivacyConfig(): Promise<Result<PrivacyConfig, Error>> {
  return toResult(async () => {
    const res = await restGet<PrivacyConfig>("privacy_config", "ai_disclosure_accepted,ai_disclosure_accepted_at,privacy_policy_version,tos_version,data_retention_days,updated_at");
    if (!res.ok) {
      throw unwrapError(res);
    }
    const rows = res.value;
    if (!rows || rows.length === 0) {
      // Sin datos configurados → valores por defecto honestos (N5)
      return {
        ai_disclosure_accepted: false,
        ai_disclosure_accepted_at: null,
        privacy_policy_version: null,
        tos_version: null,
        data_retention_days: null,
        updated_at: null,
      };
    }
    return rows[0];
  });
}

/**
 * Obtiene el registro de consentimientos desde `consent_log`.
 */
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

/**
 * Actualiza la aceptación de la divulgación de IA (opt-in).
 * Usa PATCH → upsert por primary key (tenant_id) en privacy_config.
 */
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