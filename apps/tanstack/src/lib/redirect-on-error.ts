/**
 * HUB by Raisen — Helper reutilizable de redirect ante errores de fetcher (Hotfix L-1).
 * Historia: J redirigia a /login, K a /onboarding/tenant. Los dos rompen la UX:
 * falta de tenant NO es falta de sesion y NUNCA debe sacar al usuario de la pagina.
 * L-1: config_incompleta = no-op intencional (la pagina muestra su estado + CTA).
 *      no_autorizado = unico redirect legitimo (sesion caida -> /login).
 * C4 <=30.
 */
import { readLocalSession } from "./auth";

/** Lee role del JWT (app_metadata.role o raw user_metadata). Informativo, ya no decide redirect. */
export function resolveUserRole(): string | null {
  const session = readLocalSession();
  if (!session?.user) return null;
  const meta = (session.user.app_metadata ?? session.user.user_metadata) as Record<string, unknown> | undefined;
  return typeof meta?.role === "string" ? meta.role : null;
}

export function handleFetcherError(kind: "config_incompleta" | "no_autorizado"): void {
  if (typeof window === "undefined") return;
  // L-1: solo la sesion caida justifica un redirect duro. config_incompleta se
  // queda en la pagina (9 cards de canales, tabs de templates, banner con CTA).
  if (kind !== "no_autorizado") return;
  window.location.href = "/login";
}
