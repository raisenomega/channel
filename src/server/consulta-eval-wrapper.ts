/**
 * HUB by Raisen — PR4: compone el lazo cerrado de consulta (eval LLM + confirmar/preguntar en hilo + aprender).
 * Lazy. Kill-switch CONSULTA_LAZO=off lo apaga sin redeploy. Fire-and-forget. C4 <=75. Sin any.
 */
import { getEnv } from "../shared/infrastructure/supabase-rest.helper.ts";
import { AnthropicAdapter } from "../cognition/infrastructure/anthropic.adapter.ts";
import { ConsultaEvalProducer } from "../cognition/application/consulta-eval.producer.ts";
import { evaluarLazoConsulta, type LoopPorts } from "../cognition/application/consulta-close-loop.ts";
import { leerConsulta } from "../cognition/infrastructure/agent-consulta.repo.ts";
import { escribirMensajeAgente, aprenderConsulta } from "../cognition/infrastructure/consulta-learn.repo.ts";
import { contextoMemorizado } from "../cognition/infrastructure/context-reader.ts";

export function buildConsultaEval(): ((tenantId: string, consultaId: string) => void) | undefined {
  if ((getEnv("CONSULTA_LAZO") ?? "on") === "off") return undefined;
  const prod = new ConsultaEvalProducer(new AnthropicAdapter(getEnv("ANTHROPIC_API_KEY") ?? ""));
  const ports: LoopPorts = {
    leer: async (t, c) => { const th = await leerConsulta(t, c); return th ? { pregunta: th.pregunta, respuestas: th.respuestas.map((r) => r.texto), resuelta: th.resuelta } : null; },
    negocio: async (t) => { const n = await contextoMemorizado(t); return `${n.brandVoice}\n${n.catalogContext}`; },
    evaluar: async (p, r, ctx) => { const v = await prod.evaluar(p, r, ctx); return v.ok ? v.value : null; },
    escribir: escribirMensajeAgente,
    aprender: aprenderConsulta,
  };
  return (tenantId, consultaId) => void evaluarLazoConsulta(ports, tenantId, consultaId);
}
