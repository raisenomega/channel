/**
 * HUB by Raisen — Helper reutilizable de redirect ante errores de fetcher (Hotfix K-2).
 * Previene el bug J/K: confundir falta de tenant con falta de sesion.
 * Uso en hooks de inicio: handleFetcherError(r.error.kind)
 * C4 ≤20.
 */
export function handleFetcherError(kind: "config_incompleta" | "no_autorizado"): void {
  if (typeof window === "undefined") return;
  window.location.href = kind === "config_incompleta" ? "/onboarding/tenant" : "/login";
}