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
}
