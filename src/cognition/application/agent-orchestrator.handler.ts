/**
 * Agent Orchestrator (BC Cognition). Ciclo: contexto -> decidir -> razonar
 * -> SAFE -> agent_interactions -> responder. Result<T,E>. C4.
 */
import { Result, err, ok } from "../../shared/domain/result.ts";
import { EthicsGuard } from "../domain/ethics.guard.ts";
import { decidirAccionPorConfianza, ConfidenceVO } from "../domain/confidence.vo.ts";
import type { AIProviderRegistry } from "../domain/ai-provider-registry.ts";
import { AgentContextService, AgentContextSource } from "./agent-context.ts";
import { AgentInteractionLogger, AgentInteractionRepository } from "./agent-interaction-logger.ts";
import { AgentReasoner } from "./agent-reasoner.ts";
import { AgentSafeGate } from "./agent-safe.ts";
import { OrchestratorResults } from "./agent-orchestrator.results.ts";
import { MockAIProvider } from "./mock-ai-provider.ts";
import type { AgentOrchestratorCommand, AgentOrchestratorResult, OrchestratorError } from "./agent-orchestrator.types.ts";
export type { AgentOrchestratorCommand, AgentOrchestratorResult, OrchestratorError };
export { MockAIProvider };
export class AgentOrchestrator {
  private readonly contextService: AgentContextService;
  private readonly reasoner: AgentReasoner;
  private readonly safeGate: AgentSafeGate;
  private readonly interactionLogger: AgentInteractionLogger;
  private readonly results = new OrchestratorResults();

  constructor(
    providerRegistry: AIProviderRegistry,
    contextSource?: AgentContextSource,
    interactionRepo?: AgentInteractionRepository,
  ) {
    const resolved = providerRegistry.resolver("deepseek");
    const provider = resolved.ok ? resolved.value : new MockAIProvider();
    this.contextService = new AgentContextService(contextSource);
    this.reasoner = new AgentReasoner(provider);
    this.safeGate = new AgentSafeGate();
    this.interactionLogger = new AgentInteractionLogger(interactionRepo);
  }

  async ejecutar(
    cmd: AgentOrchestratorCommand,
  ): Promise<Result<AgentOrchestratorResult, OrchestratorError>> {
    const ethics = EthicsGuard.evaluar(cmd.normalizedMessage.content, "");
    if (!ethics.ok) return err({ kind: "ethics_violation" });
    const contexto = await this.contextService.obtener(cmd.normalizedMessage);
    if (!contexto.ok) return err({ kind: "context_failed", cause: contexto.error.cause });
    const confidence: ConfidenceVO = { value: cmd.autonomyConfig.isActive ? 0.75 : 0.0 };
    const modo = decidirAccionPorConfianza(confidence.value);
    if (modo.kind === "escalar" || !cmd.autonomyConfig.isActive) {
      return this.results.terminal(modo.kind === "escalar" ? "escalar" : "no_actuar", confidence);
    }
    const razonado = await this.reasoner.razonar(cmd.normalizedMessage, cmd.channel, contexto.value);
    if (!razonado.ok) return err({ kind: "llm_failure", cause: razonado.error.cause });
    const safe = await this.safeGate.revisar(
      cmd.tenantId, cmd.normalizedMessage.content, cmd.channel,
      razonado.value.action, razonado.value.response, confidence.value,
    );
    if (!safe.ok) return err({ kind: "safe_blocked" });
    if (safe.value === "blocked") return this.results.terminal("safe_blocked", confidence);
    const registro = await this.interactionLogger.registrar({
      tenantId: cmd.tenantId, conversationId: cmd.conversationId, contactId: cmd.contactId,
      channel: cmd.channel, contactMessage: cmd.normalizedMessage.content, reasoning: null,
      confidencePre: confidence, agentResponse: razonado.value.response, actionTaken: null,
      model: razonado.value.model, costUsd: razonado.value.costUsd,
      wasCorrect: null, correctionCategory: null,
    });
    if (!registro.ok) return err({ kind: "registration_failed", cause: registro.error.cause });

    return ok(Object.freeze({
      response: razonado.value.response,
      action: razonado.value.action,
      confidence, modelUsed: razonado.value.model,
      costUsd: razonado.value.costUsd, toolExecuted: null,
      escalated: false, interactionId: registro.value.id,
    }));
  }
}