/**
 * HUB by Raisen — Datos SAFE governance (RLS por tenant). Ayudas en helpers/mappers.
 */
import { Result, err, ok } from "@shared/domain/result.ts";
import type { SessionUsuario } from "./auth-client.ts";
import type { SafeSnapshot } from "./types.ts";
import { SafeDataError, safeCfg, safeAuth } from "./safe-client-helpers.ts";
import { agregar } from "./safe-client-mappers.ts";

export type { SafeDataError } from "./safe-client-helpers.ts";

export async function cargarSafe(s: SessionUsuario): Promise<Result<SafeSnapshot, SafeDataError>> {
  const { supabaseUrl, anonKey } = safeCfg();
  if (!supabaseUrl || !anonKey) return err({ kind: "config_incompleta" });
  try {
    const [evalsRes, progRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/safe_evaluations?select=status,disagreement_pct&limit=200`, {
        headers: safeAuth(s, anonKey),
      }),
      fetch(`${supabaseUrl}/rest/v1/autonomy_progression?select=current_phase,is_kill_switched,kill_switch_reason&limit=1`, {
        headers: safeAuth(s, anonKey),
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