/**
 * HUB by Raisen — Compone el servicio de autodraft (S6/S7): flag+config + productor (Anthropic+contexto) +
 * clasificador. Si se pasa un ChannelRouter, habilita el AUTO-ENVIO del modo autonomo (aprobar+enviar) + el
 * contador del tope diario. Sin router -> solo genera borradores (seguro). C4 <=75.
 */
import { MaybeAutodraftService } from "../cognition/application/maybe-autodraft.service.ts";
import { IntentClassifier } from "../cognition/application/intent-classifier.ts";
import { GenerateDraftHandler } from "../cognition/application/generate-draft.handler.ts";
import { perfilContacto } from "../cognition/infrastructure/contact-profile.query.ts";
import { AgentContextService } from "../cognition/application/agent-context.ts";
import { AgentContextSourceSupabase } from "../cognition/infrastructure/agent-context-source.supabase.ts";
import { AgentReasoner } from "../cognition/application/agent-reasoner.ts";
import { PersistDraftHandler } from "../cognition/application/persist-draft.handler.ts";
import { AgentDraftsRepository } from "../cognition/infrastructure/agent-drafts.repository.ts";
import { AnthropicAdapter } from "../cognition/infrastructure/anthropic.adapter.ts";
import { AutodraftFlagSupabase, SentCounterSupabase } from "../cognition/infrastructure/autodraft-flag.repo.ts";
import { ApproveDraftHandler } from "../cognition/application/approve-draft.handler.ts";
import { SendApprovedDraftService } from "../cognition/application/send-approved-draft.service.ts";
import { ConversationRepositorySupabase } from "../inbox/infrastructure/conversation.repository.supabase.ts";
import type { ChannelRouter } from "../channels/application/channel.router.ts";
import type { AgentDraft } from "../cognition/domain/agent-draft.entity.ts";
import type { ChannelType } from "../shared/domain/types.ts";
import { getEnv } from "../shared/infrastructure/supabase-rest.helper.ts";

// approved_by es UUID (migr 039, sin FK); "autonomous" NO es UUID -> el PATCH daba 400 y el approve fallaba
// en silencio -> el draft quedaba en status=draft -> el send daba STATUS_NOT_APPROVED. Nil UUID = aprobador autonomo.
const AUTONOMOUS_APPROVER = "00000000-0000-0000-0000-000000000000";

export function buildAutodraft(router?: ChannelRouter): MaybeAutodraftService {
  const adapter = new AnthropicAdapter(getEnv("ANTHROPIC_API_KEY") ?? "");
  const repo = new AgentDraftsRepository();
  const generate = new GenerateDraftHandler(new AgentContextService(new AgentContextSourceSupabase()), new AgentReasoner(adapter), new PersistDraftHandler(repo));
  const autoSend = router ? {
    enviar: async (d: AgentDraft, to: string, ch: string): Promise<void> => {
      const ap = await new ApproveDraftHandler(repo).ejecutar(d.id, d.tenantId, AUTONOMOUS_APPROVER, undefined);
      if (!ap.ok) { console.error(`[autodraft-send] approve FALLO draft=${d.id}`, ap.error); return; }
      const r = await new SendApprovedDraftService(repo, router, new ConversationRepositorySupabase()).ejecutar(d.id, to, ch as ChannelType);
      if (!r.ok) console.error(`[autodraft-send] send FALLO draft=${d.id} to=${to} ch=${ch}`, r.error); else console.error(`[autodraft-send] OK draft=${d.id} to=${to}`);
    },
  } : undefined;
  return new MaybeAutodraftService(new AutodraftFlagSupabase(), generate, new IntentClassifier(adapter), autoSend, router ? new SentCounterSupabase() : undefined, perfilContacto);
}
