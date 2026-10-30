/**
 * HUB by Raisen — PR4 lazo cerrado: cuando el dueno responde una consulta/escalada del AGENTE, el agente
 * LEE todo el hilo y decide si ya entendio (satisfecho) o le falta algo (una pregunta de seguimiento). Es
 * agente-only: lo que produce va al hilo del agente, NUNCA al chat del cliente. C4 <=75. Sin any.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";
import type { AIProvider } from "../domain/ai-provider.ts";

export interface ConsultaVerdict {
  readonly satisfecho: boolean;   // true = ya tiene todo para resolver, puede cerrar
  readonly mensaje: string;       // confirmacion ("recibi, entiendo X, puedes cerrar") o UNA pregunta de seguimiento
  readonly aprendizaje: string;   // regla reutilizable aprendida (para DB + cerebro; vacio si nada solido aun)
}

const PROMPT = [
  "Eres el AGENTE de atencion. Le hiciste una consulta/duda a tu dueno y el te respondio. Lee TODO el hilo.",
  "Si con lo que te dijo YA puedes resolver sin mas dudas: satisfecho=true; mensaje=confirmacion breve en 1a",
  "persona que diga que RECIBISTE, LEISTE COMPLETO y ENTIENDES (resume en 1 linea lo que entendiste) y cierra",
  "con 'Listo, tengo todo, ya puedes cerrar esta conversacion.'; aprendizaje=la REGLA reutilizable y accionable",
  "que aprendiste (clara, para no volver a preguntar lo mismo). Si AUN te falta algo concreto: satisfecho=false;",
  "mensaje=UNA sola pregunta de seguimiento especifica y completa que acabe con TODA la duda de raiz (no vayas a",
  "goteo); aprendizaje=lo que ya quedo claro (puede ir vacio). Nunca inventes montos ni datos.",
  "Responde SOLO JSON valido, sin texto extra, shape exacto:",
  '{"satisfecho":bool,"mensaje":string,"aprendizaje":string}',
].join("\n");

export class ConsultaEvalProducer {
  constructor(private readonly ai: AIProvider) {}

  async evaluar(pregunta: string, respuestas: readonly string[], contexto: string): Promise<Result<ConsultaVerdict, { readonly kind: string }>> {
    const hilo = `PREGUNTA DEL AGENTE: ${pregunta}\n\nRESPUESTAS DE TU DUENO:\n${respuestas.map((r, i) => `${i + 1}. ${r}`).join("\n")}`;
    const llm = await this.ai.completar({ systemPrompt: `${PROMPT}\n\nContexto del negocio: ${contexto}`, messages: [{ role: "user", content: hilo }], tools: null, maxTokens: 700, tier: "sonnet" });
    if (!llm.ok) return err({ kind: "llm_failure" });
    try {
      const j = JSON.parse(llm.value.response.replace(/```json\s*|\s*```/g, "").trim()) as Partial<ConsultaVerdict>;
      return ok({ satisfecho: Boolean(j.satisfecho), mensaje: String(j.mensaje ?? ""), aprendizaje: String(j.aprendizaje ?? "") });
    } catch { return err({ kind: "parse_failure" }); }
  }
}
