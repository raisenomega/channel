/**
 * HUB by Raisen — Contexto del agente de cliente (BC Cognition). Recupera knowledge + historial + el
 * contexto REAL del negocio (voz/facts + catalogo) antes de razonar. "Enriquece, no bloquea": si el
 * negocio no carga, usa fallback honesto. Se inyecta `AgentContextSource` (impl en infraestructura).
 * C4 <=75. Result<T,E>, sin any.
 */
import { Result, ok, err } from "../../shared/domain/result.ts";
import type { AgentKnowledgeState } from "../domain/agent.service.ts";
import type { NormalizedMessage } from "../../channels/domain/channel.adapter.ts";

export interface AgentContext {
  readonly knowledge: readonly AgentKnowledgeState[];
  readonly history: readonly string[];
  readonly brandVoice: string;       // contexto real del negocio (facts) que usa el agente
  readonly catalogContext: string;   // catalogo/SKU real
  readonly contactProfile?: string | undefined; // B4: nombre + segmento (nuevo/recurrente/VIP) del contacto
}
export type AgentContextError = { readonly kind: "context_unavailable"; readonly cause: string };
export interface NegocioContext { readonly brandVoice: string; readonly catalogContext: string; }

export interface AgentContextSource {
  obtenerKnowledge(): Promise<Result<readonly AgentKnowledgeState[], AgentContextError>>;
  obtenerHistorial(conversationId: string): Promise<Result<readonly string[], AgentContextError>>;
  obtenerNegocio(tenantId: string): Promise<Result<NegocioContext, AgentContextError>>;
}

const FALLBACK: NegocioContext = { brandVoice: "Profesional, cercano y honesto.", catalogContext: "(sin contexto cargado)" };

export class AgentContextService {
  private readonly source: AgentContextSource | null;
  constructor(source?: AgentContextSource) { this.source = source ?? null; }

  async obtener(cmd: NormalizedMessage, tenantId: string): Promise<Result<AgentContext, AgentContextError>> {
    if (this.source === null) {
      return ok(Object.freeze({ knowledge: Object.freeze([]), history: Object.freeze([cmd.content]), ...FALLBACK }));
    }
    const [k, h, n] = await Promise.all([
      this.source.obtenerKnowledge(), this.source.obtenerHistorial("todo"), this.source.obtenerNegocio(tenantId),
    ]);
    if (!k.ok) return err(k.error);
    if (!h.ok) return err(h.error);
    const negocio = n.ok ? n.value : FALLBACK; // el negocio enriquece, no bloquea
    return ok(Object.freeze({ knowledge: k.value, history: h.value, brandVoice: negocio.brandVoice, catalogContext: negocio.catalogContext }));
  }
}
