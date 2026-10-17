/**
 * HUB by Raisen — Helper reutilizable de redirect ante errores de fetcher (Hotfix K-2/K-3).
 * Previene el bug J/K: confundir falta de tenant con falta de sesion.
 * K-3: superadmin role NO redirige a /onboarding/tenant (no tiene tenant_id, es correcto).
 * Uso en hooks de inicio: handleFetcherError(r.error.kind)
 * C4 ≤30.
 */
import { readLocalSession } from "./auth";

/** Lee role del JWT (app_metadata.role o raw user_metadata). */
export function resolveUserRole(): string | null {
  const session = readLocalSession();
  if (!session?.user) return null;
  const meta = (session.user.app_metadata ?? session.user.user_metadata) as Record<string, unknown> | undefined;
  return typeof meta?.role === "string" ? meta.role : null;
}

export function handleFetcherError(kind: "config_incompleta" | "no_autorizado"): void {
  if (typeof window === "undefined") return;
  // K-3: superadmin sin tenant no redirige, solo muestra vista vacia
  if (kind === "config_incompleta" && resolveUserRole() === "superadmin") return;
  window.location.href = kind === "config_incompleta" ? "/onboarding/tenant" : "/login";
}