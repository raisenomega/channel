import { AgentKnowledgeState } from "./agent.service.ts";

export type AgentAction =
  | { readonly kind: "responder"; readonly text: string }
  | { readonly kind: "ejecutar_tool"; readonly tool: string; readonly params: Readonly<Record<string, unknown>> }
  | { readonly kind: "escalar"; readonly reason: string }
  | { readonly kind: "no_actuar" };

export class AgentService {
  decidir(
    message: string,
    confidence: number,
    channel: string,
    autonomyConfig: { readonly isActive: boolean },
  ): AgentAction {
    if (!autonomyConfig.isActive) return { kind: "no_actuar" };
    if (confidence >= 0.9) return { kind: "responder", text: "" };
    if (confidence >= 0.7) return { kind: "responder", text: "" };
    if (confidence >= 0.3) return { kind: "responder", text: "" };
    return { kind: "escalar", reason: "confianza_insuficiente" };
  }

  aplicarFeedback(
    knowledge: AgentKnowledgeState,
    wasCorrect: boolean,
  ): AgentKnowledgeState {
    return Object.freeze({
      ...knowledge,
      timesApplied: knowledge.timesApplied + 1,
      timesConfirmed: wasCorrect ? knowledge.timesConfirmed + 1 : knowledge.timesConfirmed,
      timesCorrected: wasCorrect ? knowledge.timesCorrected : knowledge.timesCorrected + 1,
      confidence: wasCorrect
        ? Math.min(1, knowledge.confidence + 0.05)
        : Math.max(0, knowledge.confidence - 0.15),
    });
  }
}