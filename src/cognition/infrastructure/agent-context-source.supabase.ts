/**
 * HUB by Raisen — Impl real de AgentContextSource: alimenta a los agentes de cliente con el contexto REAL del
 * negocio via el lector UNICO con memoria (context-reader). Knowledge/historial = honestos-vacios hasta tener
 * sus repos. Service-role via los repos ya existentes. C4 <=75. Sin any.
 */
import { Result, ok } from "../../shared/domain/result.ts";
import type { AgentContextSource, NegocioContext, AgentContextError } from "../application/agent-context.ts";
import type { AgentKnowledgeState } from "../domain/agent.service.ts";
import { leerHilo } from "./strategic-queries.ts";
import type { ThreadMsg } from "../application/closing-draft.producer.ts";
import { contextoMemorizado } from "./context-reader.ts";
import { leerKnowledge } from "./agent-knowledge.query.ts";
import { cerebroRetrieve } from "../../integrations/infrastructure/cerebro-client.ts";

export class AgentContextSourceSupabase implements AgentContextSource {
  async obtenerKnowledge(tenantId: string): Promise<Result<readonly AgentKnowledgeState[], AgentContextError>> {
    return ok(Object.freeze(await leerKnowledge(tenantId))); // conocimiento ACTIVO que el dueno enseno -> el agente lo cita
  }
  async obtenerHistorial(conversationId: string): Promise<Result<readonly ThreadMsg[], AgentContextError>> {
    if (!conversationId) return ok(Object.freeze([]));
    return ok(Object.freeze(await leerHilo(conversationId))); // hilo real: el agente recuerda lo ya dicho
  }
  async obtenerNegocio(tenantId: string): Promise<Result<NegocioContext, AgentContextError>> {
    return ok(await contextoMemorizado(tenantId)); // contexto COMPLETO byte a byte + memoria persistente (15d)
  }
  // CEREBRO: memoria persistente del cliente (RAG+grafo). cerebroRetrieve ya degrada solo (vacio si cae/lento).
  async obtenerMemoria(tenantId: string, idType: string, idValue: string, query: string, agent: string): Promise<readonly string[]> {
    const ctx = await cerebroRetrieve({ identity: { idType: idType as "phone" | "email" | "social_handle" | "local_id", idValue }, query, requestingAgent: agent, tenantId, maxChunks: 6 });
    return Object.freeze([...ctx.chunks.map((c) => c.content), ...ctx.facts.map((f) => f.text)]);
  }
}
