/**
 * HUB by Raisen — Guardia SAFE pre-send (BC Cognition).
 * Paso 5 del ciclo: evalua acciones criticas antes del envio.
 *
 * C4: < 75 lineas. Pattern Result<T, E>. Sin any.
 */
import { Result, ok, err } from "../../shared/domain/result.ts";
import type { ChannelType } from "../../shared/domain/types.ts";
import type { AgentAction } from "../domain/agent-executor.ts";
import { TOOL_REGISTRY } from "../domain/tool.registry.ts";
import { SafePreSendHandler } from "../safe/safe-evaluator.ts";
import type { TenantId } from "../../shared/domain/ids.ts";

export type SafeDecision = "approved" | "blocked" | "abstained";
export type SafePreSendError = { readonly kind: "safe_blocked" };

export class AgentSafeGate {
  private readonly handler: SafePreSendHandler;

  constructor(handler?: SafePreSendHandler) {
    this.handler = handler ?? new SafePreSendHandler();
  }

  async revisar(
    tenantId: TenantId,
    inputMessage: string,
    channel: ChannelType,
    action: AgentAction,
    response: string,
    confidence: number,
  ): Promise<Result<SafeDecision, SafePreSendError>> {
    const toolName = action.kind === "ejecutar_tool" ? action.tool : null;
    const toolDef = toolName === null ? undefined : TOOL_REGISTRY[toolName];
    if (toolDef === undefined || !toolDef.requiresSafeEvaluation) {
      return ok("approved" as const);
    }

    const result = await this.handler.evaluar(Object.freeze({
      interactionId: null,
      inputMessage,
      agentResponse: response,
      actionTaken: action.kind === "ejecutar_tool"
        ? (action.params as Readonly<Record<string, unknown>>)
        : null,
      confidence,
      channel,
      contactSegment: null,
      tenantId,
    }));
    if (!result.ok) return err({ kind: "safe_blocked" });
    return ok(result.value.decision as SafeDecision);
  }
}