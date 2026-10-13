import { Result, ok } from "../../shared/domain/result.ts";
import { AgentService } from "../domain/agent-executor.ts";
import type { AgentKnowledgeState } from "../domain/agent.service.ts";

export interface PostEnvioEvalCommand {
  readonly knowledgeState: AgentKnowledgeState;
  readonly wasCorrect: boolean;
}

export class PostEnvioEvalHandler {
  private readonly agentService = new AgentService();

  async ejecutar(cmd: PostEnvioEvalCommand): Promise<Result<PostEnvioResult, never>> {
    const actualizado = this.agentService.aplicarFeedback(
      cmd.knowledgeState,
      cmd.wasCorrect,
    );
    return ok(Object.freeze({
      newConfidence: actualizado.confidence,
      timesApplied: actualizado.timesApplied,
      shouldArchive: actualizado.confidence < 0.2,
      shouldPromote: actualizado.confidence > 0.9 && actualizado.timesConfirmed >= 5,
    }));
  }
}

export interface PostEnvioResult {
  readonly newConfidence: number;
  readonly timesApplied: number;
  readonly shouldArchive: boolean;
  readonly shouldPromote: boolean;
}