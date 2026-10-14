/**
 * HUB by Raisen — Tipos del cliente de autenticacion.
 */
export interface TenantKey {
  readonly tenantId: string;
  readonly name: string;
  readonly plan: string;
  readonly slug: string;
}

export interface SessionUsuario {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly uid: string;
  readonly email: string;
  readonly tenant: TenantKey | null;
}

export type AuthError =
  | { readonly kind: "config_incompleta" }
  | { readonly kind: "no_autorizado" }
  | { readonly kind: "correo_no_confirmado"; readonly presentado?: boolean }
  | { readonly kind: "credenciales_invalidas" }
  | { readonly kind: "email_existe" }
  | { readonly kind: "red"; readonly cause: string }
  | { readonly kind: "desconocido"; readonly cause: string };