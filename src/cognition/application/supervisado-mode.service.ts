/**
 * HUB by Raisen — Supervisado mode service (Slide 4.2b-1, R19 OMEGA pattern).
 * P2/P3 gates: cuando debe ir a cola supervisada. C4 ≤75.
 */
import { LIMITS, ACCIONES_PROHIBIDAS } from "../domain/limits.ts";

const SUPERVISADO_FLAG = "supervisado";

export interface DraftCandidate {
  readonly personaSlug: string;
  readonly confidence: number;
  readonly accion: string | null;
}

export function debeSupervisar(c: DraftCandidate, requiereAprobacion: boolean): boolean {
  if (!requiereAprobacion) return false;
  if (c.personaSlug === "angel") return true;
  if (c.accion && (ACCIONES_PROHIBIDAS as Set<string>).has(c.accion)) return true;
  const confidence10 = Math.round(c.confidence * 10);
  return confidence10 < LIMITS.MIN_CONFIDENCE_TO_ACT;
}

export function marcarSupervisado(
  metadata: Readonly<Record<string, unknown>> | undefined,
): Readonly<Record<string, unknown>> {
  return Object.freeze({ ...(metadata ?? {}), [SUPERVISADO_FLAG]: true });
}

export function esSupervisado(metadata: Readonly<Record<string, unknown>> | undefined): boolean {
  return Boolean(metadata && metadata[SUPERVISADO_FLAG] === true);
}