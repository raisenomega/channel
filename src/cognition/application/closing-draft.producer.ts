/**
 * HUB by Raisen — Sistema B: el "cerrador". Lee el hilo de una conversacion QUIETA y decide si vale un
 * borrador de CIERRE de venta. Devuelve el mensaje + encabezado honesto para el operador (conclusion, que
 * identifico, % de acierto). NO auto-envia: va a Borradores para aprobar. C4 <=75. Sin any.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";
import type { AIProvider } from "../domain/ai-provider.ts";

export interface ThreadMsg { readonly from: "cliente" | "negocio"; readonly text: string; }

export interface ClosingDraft {
  readonly worth: boolean;      // vale un cierre?
  readonly message: string;     // borrador de cierre (voz del negocio)
  readonly conclusion: string;  // por que lo propone (o no)
  readonly identified: string;  // senal del comportamiento del cliente
  readonly confidence: number;  // 0-100: estimacion honesta de acertar
}

const PROMPT = [
  "Eres un cerrador de ventas analizando una conversacion que se quedo QUIETA (el cliente dejo de responder).",
  "Decide si vale la pena un SEGUIMIENTO para cerrar la venta. Honesto: si ya se cerro, no hubo intencion de",
  "compra, o es soporte ya resuelto -> worth=false. Si habia interes sin cerrar -> worth=true y redacta un",
  "mensaje calido y breve en la voz del negocio, sin presionar.",
  "Responde SOLO JSON valido (sin texto extra) con este shape exacto:",
  '{"worth":bool,"message":string,"conclusion":string,"identified":string,"confidence":number}',
  "conclusion=por que propones (o no) el cierre. identified=la senal del comportamiento. confidence=0-100,",
  "tu estimacion honesta de que el seguimiento ayude a cerrar.",
].join("\n");

export class ClosingDraftProducer {
  constructor(private readonly ai: AIProvider) {}

  async producir(thread: readonly ThreadMsg[], contexto: string): Promise<Result<ClosingDraft, { readonly kind: string }>> {
    const hilo = thread.map((m) => `${m.from}: ${m.text}`).join("\n");
    const llm = await this.ai.completar({ systemPrompt: `${PROMPT}\n\nContexto del negocio: ${contexto}`, messages: [{ role: "user", content: hilo }], tools: null, maxTokens: 900, tier: "sonnet" });
    if (!llm.ok) return err({ kind: "llm_failure" });
    return parse(llm.value.response);
  }
}

function parse(raw: string): Result<ClosingDraft, { readonly kind: string }> {
  try {
    const j = JSON.parse(raw.replace(/```json\s*|\s*```/g, "").trim()) as Partial<ClosingDraft>;
    const confidence = Math.max(0, Math.min(100, Math.round(Number(j.confidence) || 0)));
    return ok({ worth: Boolean(j.worth), message: String(j.message ?? ""), conclusion: String(j.conclusion ?? ""), identified: String(j.identified ?? ""), confidence });
  } catch { return err({ kind: "parse_failure" }); }
}
