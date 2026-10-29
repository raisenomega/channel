/**
 * HUB by Raisen — Contexto del agente de cliente (BC Cognition). Recupera knowledge + historial + el
 * contexto REAL del negocio (voz/facts + catalogo) antes de razonar. "Enriquece, no bloquea": si el
 * negocio no carga, usa fallback honesto. Se inyecta `AgentContextSource` (impl en infraestructura).
 * C4 <=75. Result<T,E>, sin any.
 */
import { Result, ok, err } from "../../shared/domain/result.ts";
import type { AgentKnowledgeState } from "../domain/agent.service.ts";
import type { NormalizedMessage } from "../../channels/domain/channel.adapter.ts";
import type { ThreadMsg } from "./closing-draft.producer.ts";
import type { ModelTier } from "../domain/routing-table.ts";

export interface AgentContext {
  readonly knowledge: readonly AgentKnowledgeState[];
  readonly history: readonly ThreadMsg[]; // turnos previos del hilo (memoria del agente)
  readonly brandVoice: string;       // contexto real del negocio (facts) que usa el agente
  readonly catalogContext: string;   // catalogo/SKU real
  readonly contactProfile?: string | undefined; // B4: nombre + segmento (nuevo/recurrente/VIP) del contacto
  readonly tier?: ModelTier; // modelo por persona (rutina=haiku, venta=sonnet)
  readonly mediaUrl?: string | undefined; readonly mediaMime?: string | undefined; // vision: si el inbound es imagen, el agente la VE
  readonly memoria?: readonly string[] | undefined; // CEREBRO: chunks/facts del cliente (RAG) -> el agente razona con memoria
}
export type AgentContextError = { readonly kind: "context_unavailable"; readonly cause: string };
export interface NegocioContext { readonly brandVoice: string; readonly catalogContext: string; }

export interface AgentContextSource {
  obtenerKnowledge(tenantId: string): Promise<Result<readonly AgentKnowledgeState[], AgentContextError>>;
  obtenerHistorial(conversationId: string): Promise<Result<readonly ThreadMsg[], AgentContextError>>;
  obtenerNegocio(tenantId: string): Promise<Result<NegocioContext, AgentContextError>>;
  obtenerMemoria?(tenantId: string, idType: string, idValue: string, query: string, agent: string): Promise<readonly string[]>; // CEREBRO (opcional; enriquece, no bloquea)
}

const FALLBACK: NegocioContext = { brandVoice: "Profesional, cercano y honesto.", catalogContext: "(sin contexto cargado)" };

export class AgentContextService {
  private readonly source: AgentContextSource | null;
  constructor(source?: AgentContextSource) { this.source = source ?? null; }

  async obtener(cmd: NormalizedMessage, tenantId: string, conversationId?: string, agentSlug = "eco"): Promise<Result<AgentContext, AgentContextError>> {
    if (this.source === null) {
      return ok(Object.freeze({ knowledge: Object.freeze([]), history: Object.freeze([]), ...FALLBACK }));
    }
    const idType = cmd.channel === "whatsapp" ? "phone" : "social_handle"; // identidad para CEREBRO
    const [k, h, n, mem] = await Promise.all([
      this.source.obtenerKnowledge(tenantId), this.source.obtenerHistorial(conversationId ?? ""), this.source.obtenerNegocio(tenantId),
      cmd.from && this.source.obtenerMemoria ? this.source.obtenerMemoria(tenantId, idType, cmd.from, cmd.content, agentSlug) : Promise.resolve([] as readonly string[]),
    ]);
    if (!k.ok) return err(k.error);
    if (!h.ok) return err(h.error);
    const negocio = n.ok ? n.value : FALLBACK; // el negocio enriquece, no bloquea
    return ok(Object.freeze({ knowledge: k.value, history: h.value, brandVoice: negocio.brandVoice, catalogContext: negocio.catalogContext, memoria: mem }));
  }
}
