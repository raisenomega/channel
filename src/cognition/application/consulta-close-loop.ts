/**
 * HUB by Raisen — PR4 lazo cerrado (orquestador PURO). Tras cada respuesta del dueno a una consulta/escalada,
 * el agente EVALUA el hilo: confirma que recibio/leyo/entendio (y marca "listo para cerrar") o hace UNA
 * pregunta de seguimiento; y APRENDE de verdad. Agente-only: nunca toca el chat del cliente. C4 <=75. Sin any.
 */
import type { ConsultaVerdict } from "./consulta-eval.producer.ts";

export interface LoopThread { readonly pregunta: string; readonly respuestas: readonly string[]; readonly resuelta: boolean }

export interface LoopPorts {
  readonly leer: (tenantId: string, consultaId: string) => Promise<LoopThread | null>;
  readonly negocio: (tenantId: string) => Promise<string>;
  readonly evaluar: (pregunta: string, respuestas: readonly string[], contexto: string) => Promise<ConsultaVerdict | null>;
  readonly escribir: (tenantId: string, consultaId: string, texto: string, satisfecho: boolean) => Promise<void>;
  readonly aprender: (tenantId: string, consultaId: string, pregunta: string, aprendizaje: string) => Promise<void>;
}

// Se invoca fire-and-forget tras agregar una respuesta al hilo. Nunca lanza (no rompe el POST del mensaje).
export async function evaluarLazoConsulta(p: LoopPorts, tenantId: string, consultaId: string): Promise<void> {
  try {
    const th = await p.leer(tenantId, consultaId);
    if (!th || th.resuelta || th.respuestas.length === 0) return; // sin respuestas aun o ya cerrada -> nada que evaluar
    const v = await p.evaluar(th.pregunta, th.respuestas, await p.negocio(tenantId));
    if (!v || !v.mensaje) return;
    await p.escribir(tenantId, consultaId, v.mensaje, v.satisfecho); // confirmacion o seguimiento en el hilo del agente
    if (v.aprendizaje) await p.aprender(tenantId, consultaId, th.pregunta, v.aprendizaje); // DB + cerebro, siempre
  } catch {
    /* fire-and-forget: el lazo jamas rompe la respuesta de consulta */
  }
}
