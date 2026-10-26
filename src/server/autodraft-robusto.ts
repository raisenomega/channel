/**
 * HUB by Raisen — Ejecutor ROBUSTO del autodraft: reintenta los errores transitorios (LLM/envio) con backoff y
 * REGISTRA el resultado final. Antes era fire-and-forget: un hipo del LLM dejaba al cliente sin respuesta, en
 * silencio, sin reintento. Ahora: respuesta garantizada o fallo visible y reintentado. C4 <=75. Sin any.
 */
import type { MaybeAutodraftService, AutodraftEvent, AutodraftOutcome } from "../cognition/application/maybe-autodraft.service.ts";
import { registrarResultadoRespuesta } from "../cognition/infrastructure/respuesta-log.repo.ts";

const MAX = 2;

export async function ejecutarRobusto(svc: MaybeAutodraftService, ev: AutodraftEvent): Promise<void> {
  for (let i = 0; i <= MAX; i++) {
    let res: AutodraftOutcome;
    try { res = await svc.ejecutar(ev); }
    catch (e) { res = { outcome: "error", reason: e instanceof Error ? e.message : String(e) }; }
    if (res.outcome !== "error" || i === MAX) {
      await registrarResultadoRespuesta(ev, res.outcome, res.reason, i);
      if (res.outcome === "error") console.error(`[autodraft-robusto] AGOTADO ${MAX + 1} intentos ch=${ev.channel} from=${ev.from}: ${res.reason}`);
      return;
    }
    console.error(`[autodraft-robusto] reintento ${i + 1} ch=${ev.channel}: ${res.reason}`);
    await new Promise((r) => setTimeout(r, 900 * (i + 1))); // backoff
  }
}
