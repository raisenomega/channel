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

export class AgentContextSourceSupabase implements AgentContextSource {
  async obtenerKnowledge(): Promise<Result<readonly AgentKnowledgeState[], AgentContextError>> {
    return ok(Object.freeze([])); // honesto: sin repo de agent_knowledge aun
  }
  async obtenerHistorial(_conversationId: string): Promise<Result<readonly string[], AgentContextError>> {
    return ok(Object.freeze([])); // honesto: historial llega en una rebanada posterior
  }
  async obtenerNegocio(tenantId: string): Promise<Result<NegocioContext, AgentContextError>> {
    const facts = buildFacts(await leerContexto(tenantId));
    const plat = await leerPlatformContext(tenantId);
    const brandVoice = facts.length ? facts.join(" | ") : "(contexto del negocio aun vacio)";
    const catalogContext = plat.catalog.length ? plat.catalog.join("; ") : "(catalogo vacio)";
    return ok({ brandVoice, catalogContext });
  }
}
