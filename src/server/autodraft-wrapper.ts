/**
 * HUB by Raisen — Compone el servicio de autodraft (S6/S7): flag+config + productor (Anthropic+contexto) +
 * clasificador. Si se pasa un ChannelRouter, habilita el AUTO-ENVIO del modo autonomo (aprobar+enviar) + el
 * contador del tope diario. Sin router -> solo genera borradores (seguro). C4 <=75.
 */
import { MaybeAutodraftService } from "../cognition/application/maybe-autodraft.service.ts";
import { IntentClassifier } from "../cognition/application/intent-classifier.ts";
import { GenerateDraftHandler } from "../cognition/application/generate-draft.handler.ts";
import { AgentContextService } from "../cognition/application/agent-context.ts";
import { AgentContextSourceSupabase } from "../cognition/infrastructure/agent-context-source.supabase.ts";
import { AgentReasoner } from "../cognition/application/agent-reasoner.ts";
import { PersistDraftHandler } from "../cognition/application/persist-draft.handler.ts";
import { AgentDraftsRepository } from "../cognition/infrastructure/agent-drafts.repository.ts";
import { AnthropicAdapter } from "../cognition/infrastructure/anthropic.adapter.ts";
import { AutodraftFlagSupabase, SentCounterSupabase } from "../cognition/infrastructure/autodraft-flag.repo.ts";
import { ApproveDraftHandler } from "../cognition/application/approve-draft.handler.ts";
import { SendApprovedDraftService } from "../cognition/application/send-approved-draft.service.ts";
import type { ChannelRouter } from "../channels/application/channel.router.ts";
import type { AgentDraft } from "../cognition/domain/agent-draft.entity.ts";
import type { ChannelType } from "../shared/domain/types.ts";
import { getEnv } from "../shared/infrastructure/supabase-rest.helper.ts";

export function buildAutodraft(router?: ChannelRouter): MaybeAutodraftService {
  const adapter = new AnthropicAdapter(getEnv("ANTHROPIC_API_KEY") ?? "");
  const repo = new AgentDraftsRepository();
  const generate = new GenerateDraftHandler(new AgentContextService(new AgentContextSourceSupabase()), new AgentReasoner(adapter), new PersistDraftHandler(repo));
  const autoSend = router ? {
    enviar: async (d: AgentDraft, to: string, ch: string): Promise<void> => {
      await new ApproveDraftHandler(repo).ejecutar(d.id, d.tenantId, "autonomous", undefined);
      await new SendApprovedDraftService(repo, router).ejecutar(d.id, to, ch as ChannelType);
    },
  } : undefined;
  return new MaybeAutodraftService(new AutodraftFlagSupabase(), generate, new IntentClassifier(adapter), autoSend, router ? new SentCounterSupabase() : undefined);
}
