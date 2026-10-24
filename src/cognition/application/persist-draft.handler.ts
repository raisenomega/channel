/**
 * HUB by Raisen — Persistir draft en agent_drafts (Slide 4.2b-1).
 * Toma hold_for_human_review y persiste con metadata supervisado. C4 ≤75.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";
import { esPersonaCanonica } from "../domain/agent-draft.entity.ts";
import type { AgentDraft } from "../domain/agent-draft.entity.ts";
import { marcarSupervisado } from "./supervisado-mode.service.ts";
import type { AgentDraftsRepository } from "../infrastructure/agent-drafts.repository.ts";
import type { TenantId, ConversationId, ContactId } from "../../shared/domain/ids.ts";

export type PersistDraftError =
  | { readonly kind: "PERSONA_INVALIDA"; readonly slug: string }
  | { readonly kind: "REPO_ERROR"; readonly causa: string };

export interface PersistDraftCommand {
  readonly tenantId: TenantId;
  readonly conversationId: ConversationId;
  readonly contactId: ContactId;
  readonly personaSlug: string;
  readonly inboundMessage: string;
  readonly draftContent: string;
  readonly confidence: number;
  readonly reason: string;
  readonly aiDisclosureIncluded: boolean;
  readonly traceId: string;
  readonly to?: string;
  readonly channel?: string;
}

export class PersistDraftHandler {
  constructor(private readonly repo: AgentDraftsRepository) {}

  async ejecutar(cmd: PersistDraftCommand): Promise<Result<AgentDraft, PersistDraftError>> {
    if (!esPersonaCanonica(cmd.personaSlug)) {
      return err({ kind: "PERSONA_INVALIDA", slug: cmd.personaSlug });
    }
    const metadata = marcarSupervisado(cmd.to && cmd.channel ? { to: cmd.to, channel: cmd.channel } : {});
    const draft: AgentDraft = {
      id: crypto.randomUUID(),
      tenantId: cmd.tenantId,
      conversationId: cmd.conversationId,
      contactId: cmd.contactId,
      personaSlug: cmd.personaSlug,
      inboundMessage: cmd.inboundMessage,
      draftContent: cmd.draftContent,
      confidence: cmd.confidence,
      reason: cmd.reason,
      status: "draft",
      aiDisclosureIncluded: cmd.aiDisclosureIncluded,
      traceId: cmd.traceId,
      metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      approvedBy: null, approvedAt: null, rejectedReason: null, sentAt: null, providerMessageId: null, wasCorrect: null, feedbackNote: null,
    };
    const r = await this.repo.insertar(draft);
    return r.ok ? ok(r.value) : err({ kind: "REPO_ERROR", causa: r.error.causa });
  }
}