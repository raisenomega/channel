/**
 * HUB by Raisen — Tipos del cliente de settings.
 */

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