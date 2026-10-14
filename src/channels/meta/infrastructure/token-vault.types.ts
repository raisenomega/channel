/**
 * HUB by Raisen — Tipos del vault de tokens Meta.
 * Separado de token-vault.repo.ts para cumplir C4.
 */
export interface TokenRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly signupId: string;
  readonly encryptedNonce: string;
  readonly encryptedToken: string;
  readonly keyVersion: number;
  readonly tokenType: string;
  readonly expiresAt: string | null;
  readonly createdAt: string;
  readonly rotatedAt: string | null;
}

export type VaultError =
  | { readonly kind: "persistence_failure"; readonly cause: string }
  | { readonly kind: "sin_token" }
  | { readonly kind: "clave_no_configurada" }
  | { readonly kind: "desencriptacion_fallo"; readonly cause: string };