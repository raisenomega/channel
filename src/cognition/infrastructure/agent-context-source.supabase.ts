/**
 * HUB by Raisen — Impl real de AgentContextSource: alimenta a los agentes de cliente con el contexto
 * REAL del negocio (buildFacts del Contexto) + catalogo/SKU. Knowledge/historial = honestos-vacios hasta
 * tener sus repos. Service-role via los repos ya existentes. C4 <=75. Sin any.
 */
import { Result, ok } from "../../shared/domain/result.ts";
import type { AgentContextSource, NegocioContext, AgentContextError } from "../application/agent-context.ts";
import type { AgentKnowledgeState } from "../domain/agent.service.ts";
import { leerContexto } from "./context.repo.ts";
import { buildFacts } from "../domain/business-facts.ts";
import { leerPlatformContext } from "./platform-context.repo.ts";
import { leerHilo } from "./strategic-queries.ts";
import type { ThreadMsg } from "../application/closing-draft.producer.ts";

export class AgentContextSourceSupabase implements AgentContextSource {
  async obtenerKnowledge(): Promise<Result<readonly AgentKnowledgeState[], AgentContextError>> {
    return ok(Object.freeze([])); // honesto: sin repo de agent_knowledge aun
  }
  async obtenerHistorial(conversationId: string): Promise<Result<readonly ThreadMsg[], AgentContextError>> {
    if (!conversationId) return ok(Object.freeze([]));
    return ok(Object.freeze(await leerHilo(conversationId))); // hilo real: el agente recuerda lo ya dicho
  }
  async obtenerNegocio(tenantId: string): Promise<Result<NegocioContext, AgentContextError>> {
    const facts = buildFacts(await leerContexto(tenantId));
    const plat = await leerPlatformContext(tenantId);
    const brandVoice = facts.length ? facts.join(" | ") : "(contexto del negocio aun vacio)"; // LEY HUB: contexto COMPLETO byte a byte (sin cap); el prompt caching lo mantiene barato
    const catalogContext = plat.catalog.length ? plat.catalog.join("; ") : "(catalogo vacio)";
    return ok({ brandVoice, catalogContext });
  }
}
