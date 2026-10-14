/**
 * HUB by Raisen — Mapper de filas SAFE a snapshot (sin datos inventados, N5).
 */
import type { AutonomyPhase, SafeSnapshot } from "./types.ts";

// Sin datos inventados (N5): cuenta solo columnas reales; vacio honesto si no hay filas.
export function agregar(evals: unknown, progs: unknown): SafeSnapshot {
  const filas = Array.isArray(evals) ? evals : [];
  const progRow = Array.isArray(progs) && progs.length > 0 ? progs[0] as Record<string, unknown> : null;
  let approved = 0;
  let blocked = 0;
  let abstained = 0;
  let disagreementSum = 0;
  const conDisagreement: number[] = [];
  for (const f of filas) {
    const status = String((f as Record<string, unknown>).status ?? "");
    if (status === "approved") approved += 1;
    else if (status === "blocked") blocked += 1;
    else if (status === "abstained") abstained += 1;
    const d = Number((f as Record<string, unknown>).disagreement_pct);
    if (Number.isFinite(d) && d >= 0 && d <= 100) {
      disagreementSum += d;
      conDisagreement.push(d);
    }
  }
  const total = filas.length;
  const disagreementProm = conDisagreement.length > 0 ? disagreementSum / conDisagreement.length : null;
  return Object.freeze({
    totalEvaluaciones: total,
    disagreementPromedioPct: disagreementProm,
    decisiones: { approved, blocked, abstained },
    progresion: progRow
      ? Object.freeze({
          currentPhase: (Number.isInteger(Number(progRow.current_phase))
            ? Number(progRow.current_phase)
            : 0) as AutonomyPhase,
          isKillSwitched: progRow.is_kill_switched === true,
          killSwitchReason: progRow.kill_switch_reason ? String(progRow.kill_switch_reason) : null,
        })
      : null,
  });
}