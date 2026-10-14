/**
 * HUB by Raisen — Helpers del flujo del bootstrap.
 */
import type { SessionUsuario } from "./auth-client.ts";

export interface OnboardingDatos {
  tenantName: string;
  plan: string;
  slug: string;
}

export function sessionConTenant(base: SessionUsuario, tenantId: string, datos: OnboardingDatos): SessionUsuario {
  return Object.freeze({ ...base, tenant: { tenantId, name: datos.tenantName, plan: datos.plan, slug: datos.slug } });
}

export function mensajeOnboarding(kind: string, cause?: string): string | null {
  if (kind === "no_autorizado") return "Sesion invalida. Vuelve a iniciar sesion.";
  if (kind === "validacion") return cause ?? "No se pudo crear el espacio. Verifica el identificador.";
  if (kind === "red") return cause ?? "Error de conexion. Intenta de nuevo.";
  return null;
}

export function causaDe(e: { readonly kind: string; readonly cause?: string }): string | undefined {
  return e.cause;
}