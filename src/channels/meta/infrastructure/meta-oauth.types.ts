/**
 * HUB by Raisen — Tipos OAuth de Meta (WhatsApp Cloud API).
 * Separado de meta-oauth.client.ts para cumplir C4.
 */
export interface ExchangeCodeResponse {
  readonly accessToken: string;
  readonly expiresAt: string;
  readonly businessId: string;
  readonly accountId: string;
}

export type MetaOAuthError =
  | { readonly kind: "red"; readonly cause: string }
  | { readonly kind: "meta_error"; readonly code: string; readonly message: string };