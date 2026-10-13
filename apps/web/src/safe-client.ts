/**
 * HUB by Raisen — Datos SAFE governance (solo tenant del usuario via RLS).
 * Consulta safe_evaluations y autonomy_progression con el JWT (patron inbox-client).
 */
import { Result, err, ok } from "@shared/domain/result.ts";
import type { SessionUsuario } from "./auth-client.ts";
import type { AutonomyPhase, SafeSnapshot } from "./types.ts";

export type SafeDataError =
  | { readonly kind: "config_incompleta" }
  | { readonly kind: "no_autorizado" }
  | { readonly kind: "red"; readonly cause: string };

interface HubConfig {
  readonly supabaseUrl: string;
  readonly anonKey: string;
}

function config(): HubConfig {
  const g = globalThis as Record<string, unknown>;
  const cfg = g.__HUB_CONFIG__ as HubConfig | undefined;
  return { supabaseUrl: cfg?.supabaseUrl ?? "", anonKey: cfg?.anonKey ?? "" };
}

export async function cargarSafe(s: SessionUsuario): Promise<Result<SafeSnapshot, SafeDataError>> {
  const { supabaseUrl, anonKey } = config();
  if (!supabaseUrl || !anonKey) return err({ kind: "config_incompleta" });
  try {
    const [evalsRes, progRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/safe_evaluations?select=status,disagreement_pct&limit=200`, {
        headers: auth(s, anonKey),
      }),
      fetch(`${supabaseUrl}/rest/v1/autonomy_progression?select=current_phase,is_kill_switched,kill_switch_reason&limit=1`, {
        headers: auth(s, anonKey),
      }),
    ]);
    if (evalsRes.status === 401 || evalsRes.status === 403 || progRes.status === 401 || progRes.status === 403) {
      return err({ kind: "no_autorizado" });
    }
    if (!evalsRes.ok) return err({ kind: "red", cause: `status ${evalsRes.status}` });
    if (!progRes.ok) return err({ kind: "red", cause: `status ${progRes.status}` });
    return ok(agregar(await evalsRes.json(), await progRes.json()));
  } catch (e) {
    return err({ kind: "red", cause: String(e) });
  }
}

function auth(s: SessionUsuario, anonKey: string): Record<string, string> {
  return { apikey: anonKey, authorization: `Bearer ${s.accessToken}`, accept: "application/json" };
}

// Sin datos inventados (N5): cuenta solo columnas reales; vacio honesto si no hay filas.
function agregar(evals: unknown, progs: unknown): SafeSnapshot {
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