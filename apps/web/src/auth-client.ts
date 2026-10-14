/**
 * HUB by Raisen — Cliente de autenticación (barrel).
 * La lógica vive bajo ./auth-client/ (C4 ≤75).
 */
export { auth } from "./auth-client/auth";
export type { TenantKey, SessionUsuario, AuthError } from "./auth-client/types";