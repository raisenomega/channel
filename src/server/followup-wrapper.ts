/**
 * HUB by Raisen — Sistema B 2b: compone el StrategicDraftService con infra real (leer hilo, estado de
 * seguimiento, contexto, cerrador IA, persistir). Umbrales por env. Usado por el timer. C4 <=75.
 */
import * as nodeProcess from "node:process";
import { StrategicDraftService } from "../cognition/application/strategic-draft.service.ts";
import { ClosingDraftProducer } from "../cognition/application/closing-draft.producer.ts";
import { AnthropicAdapter } from "../cognition/infrastructure/anthropic.adapter.ts";
import { getEnv } from "../shared/infrastructure/supabase-rest.helper.ts";
import { leerHilo, estadoSeguimiento, contextoCorto } from "../cognition/infrastructure/strategic-queries.ts";
import { persistirBorradorCierre } from "../cognition/infrastructure/strategic-persist.ts";

export function buildStrategic(): StrategicDraftService {
  const num = (k: string, d: number): number => Math.max(0, parseInt(nodeProcess.env[k] ?? String(d), 10) || d);
  return new StrategicDraftService({
    leerHilo, estadoSeguimiento, contextoNegocio: contextoCorto,
    cerrador: new ClosingDraftProducer(new AnthropicAdapter(getEnv("ANTHROPIC_API_KEY") ?? "")),
    persistir: persistirBorradorCierre,
    umbralConfianza: num("FOLLOWUP_MIN_CONF", 50), maxIntentos: num("FOLLOWUP_MAX_TRIES", 2), maxDiasViejo: num("FOLLOWUP_MAX_DAYS", 30),
  });
}
