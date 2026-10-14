/**
 * HUB by Raisen — Estadisticas SAFE del agente IA.
 */
import { restGet } from "../supabase";
import type { SafeStats } from "../types";
import { toResult, unwrapError } from "./helpers";
import type { Result, RawSafeRow } from "./types";
import { emptySafeStats } from "./types";

export async function getSafeStats(): Promise<Result<SafeStats, Error>> {
  return toResult(async () => {
    const res = await restGet<RawSafeRow>("safe_evaluations");
    if (!res.ok) {
      throw unwrapError(res);
    }
    const rows = res.value;
    if (!rows || rows.length === 0) {
      return emptySafeStats();
    }
    const total = rows.length;
    const approved = rows.filter((r) => r.decision === "approved").length;
    const blocked = rows.filter((r) => r.decision === "blocked").length;
    const abstained = rows.filter((r) => r.decision === "abstained").length;
    const disagreements = rows
      .map((r) => r.disagreement_pct)
      .filter((v): v is number => v !== null);
    const disagreementAvgPct =
      disagreements.length > 0
        ? disagreements.reduce((a, b) => a + b, 0) / disagreements.length
        : null;
    const fases = rows
      .map((r) => r.autonomy_phase)
      .filter((v): v is number => v !== null)
      .sort((a, b) => b - a);
    const currentPhase = (fases.length > 0 ? fases[0] : 0) as 0 | 1 | 2 | 3 | 4;
    const killSwitched = rows.find((r) => r.is_kill_switched === true);
    const isKillSwitched = !!killSwitched;
    const killSwitchReason = killSwitched?.kill_switch_reason ?? null;
    return {
      totalEvaluaciones: total,
      approved,
      blocked,
      abstained,
      disagreementAvgPct,
      currentPhase,
      isKillSwitched,
      killSwitchReason,
      sinDatos: false,
    };
  });
}