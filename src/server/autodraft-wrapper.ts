/**
 * HUB by Raisen — Compone el servicio de autodraft (S6): flag + productor (Anthropic + contexto). C4 <=75.
 */
import { MaybeAutodraftService } from "../cognition/application/maybe-autodraft.service.ts";
import { GenerateDraftHandler } from "../cognition/application/generate-draft.handler.ts";
import { AgentContextService } from "../cognition/application/agent-context.ts";
import { AgentContextSourceSupabase } from "../cognition/infrastructure/agent-context-source.supabase.ts";
import { AgentReasoner } from "../cognition/application/agent-reasoner.ts";
import { PersistDraftHandler } from "../cognition/application/persist-draft.handler.ts";
import { AgentDraftsRepository } from "../cognition/infrastructure/agent-drafts.repository.ts";
import { AnthropicAdapter } from "../cognition/infrastructure/anthropic.adapter.ts";
import { AutodraftFlagSupabase } from "../cognition/infrastructure/autodraft-flag.repo.ts";
import { getEnv } from "../shared/infrastructure/supabase-rest.helper.ts";

export function buildAutodraft(): MaybeAutodraftService {
  const generate = new GenerateDraftHandler(
    new AgentContextService(new AgentContextSourceSupabase()),
    new AgentReasoner(new AnthropicAdapter(getEnv("ANTHROPIC_API_KEY") ?? "")),
    new PersistDraftHandler(new AgentDraftsRepository()),
  );
  return new MaybeAutodraftService(new AutodraftFlagSupabase(), generate);
}
