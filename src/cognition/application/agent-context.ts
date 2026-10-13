/**
 * HUB by Raisen — Obtencion de contexto del agente (BC Cognition).
 * Paso 2 del ciclo: recupera knowledge (memoria del agente) y history
 * (historial reciente de la conversacion) antes de razonar.
 *
 * C4: < 75 lineas. Pattern Result<T, E>. Sin any.
 *
 * P1 honesto: Aun no existe repositorio de agent_knowledge ni de historial.
 * Se inyecta un opcional `AgentContextSource`; si no se provee, se devuelve
 * un contexto determinista minimalista para no bloquear el ciclo.
 */
import { Result, ok, err } from "../../shared/domain/result.ts";
import type { AgentKnowledgeState } from "../domain/agent.service.ts";
import type { NormalizedMessage } from "../../channels/domain/channel.adapter.ts";

export interface AgentContext {
  readonly knowledge: readonly AgentKnowledgeState[];
  readonly history: readonly string[];
  readonly brandVoice: string;
  readonly catalogContext: string;
}

export type AgentContextError = { readonly kind: "context_unavailable"; readonly cause: string };

/** Puerta de acceso a conocimiento + historial (P1: port sin impl). */
export interface AgentContextSource {
  obtenerKnowledge(): Promise<Result<readonly AgentKnowledgeState[], AgentContextError>>;
  obtenerHistorial(conversationId: string): Promise<Result<readonly string[], AgentContextError>>;
}

export class AgentContextService {
  private readonly source: AgentContextSource | null;

  constructor(source?: AgentContextSource) {
    this.source = source ?? null;
  }

  async obtener(cmd: NormalizedMessage): Promise<Result<AgentContext, AgentContextError>> {
    if (this.source !== null) {
      return this.#conRecurso();
    }
    // P1: sin fuente real, contexto basico deterministico.
    return ok(Object.freeze({
      knowledge: Object.freeze([]),
      history: Object.freeze([cmd.content]),
      brandVoice: "Profesional, cercano y honesto.",
      catalogContext: "(sin catalogo) P1: pendiente v_catalog_context",
    }));
  }

  async #conRecurso(): Promise<Result<AgentContext, AgentContextError>> {
    const knowledge = await this.source?.obtenerKnowledge();
    const history = await this.source?.obtenerHistorial("todo");
    if (knowledge === undefined || history === undefined) {
      return err({ kind: "context_unavailable", cause: "fuente_incompleta" });
    }
    if (!knowledge.ok) return err(knowledge.error);
    if (!history.ok) return err(history.error);
    return ok(Object.freeze({
      knowledge: knowledge.value,
      history: history.value,
      brandVoice: "Profesional, cercano y honesto.",
      catalogContext: "(sin catalogo) P1",
    }));
  }
}