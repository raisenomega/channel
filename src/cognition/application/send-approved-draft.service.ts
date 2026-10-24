/**
 * HUB by Raisen — Send approved draft. Envia via ChannelRouter. Zernio (IG/FB/WA) EXIGE conversationId +
 * accountId del proveedor -> se resuelven leyendo la conversacion del borrador (metadata o conv). Sin esos
 * refs el envio fallaba en silencio. Idempotente. C4 <=75.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";
import type { AgentDraft } from "../domain/agent-draft.entity.ts";
import type { AgentDraftsRepository } from "../infrastructure/agent-drafts.repository.ts";
import type { ChannelRouter } from "../../channels/application/channel.router.ts";
import type { ChannelType } from "../../shared/domain/types.ts";
import type { ConversationId } from "../../shared/domain/ids.ts";
import type { ConversationState } from "../../inbox/domain/conversation.types.ts";

export type SendError =
  | { readonly kind: "DRAFT_NOT_FOUND" }
  | { readonly kind: "STATUS_NOT_APPROVED"; readonly status: string }
  | { readonly kind: "SEND_FAILED"; readonly causa: string }
  | { readonly kind: "REPO_ERROR"; readonly causa: string };

export interface ConvRefReader { buscar(id: ConversationId): Promise<Result<ConversationState | null, { readonly kind: string }>>; }

export class SendApprovedDraftService {
  constructor(private readonly repo: AgentDraftsRepository, private readonly router: ChannelRouter, private readonly convs?: ConvRefReader) {}

  async ejecutar(draftId: string, to: string, channel: ChannelType): Promise<Result<AgentDraft, SendError>> {
    const draft = await this.repo.obtenerPorId(draftId);
    if (!draft.ok) return err({ kind: "REPO_ERROR", causa: draft.error.causa });
    if (!draft.value) return err({ kind: "DRAFT_NOT_FOUND" });
    if (draft.value.status === "sent") return ok(draft.value); // idempotente
    if (draft.value.status !== "approved") return err({ kind: "STATUS_NOT_APPROVED", status: draft.value.status });
    const refs = await this.#refs(draft.value);
    const r = await this.router.enviar({ to, content: draft.value.draftContent, channel, ...refs });
    if (!r.ok) return err({ kind: "SEND_FAILED", causa: r.error.kind ?? String(r.error) });
    const repoR = await this.repo.marcarEnviado(draftId, crypto.randomUUID());
    if (!repoR.ok) return err({ kind: "REPO_ERROR", causa: repoR.error.causa });
    const updated = await this.repo.obtenerPorId(draftId);
    return updated.ok && updated.value ? ok(updated.value) : err({ kind: "REPO_ERROR", causa: "read_back_failed" });
  }

  async #refs(draft: AgentDraft): Promise<{ conversationId?: string; accountId?: string }> {
    const meta = (draft.metadata ?? {}) as { providerConversationId?: string; providerAccountId?: string };
    let cid = meta.providerConversationId; let aid = meta.providerAccountId;
    if ((!cid || !aid) && this.convs && draft.conversationId) {
      const c = await this.convs.buscar(draft.conversationId);
      if (c.ok && c.value) { cid = cid ?? c.value.providerConversationId ?? undefined; aid = aid ?? c.value.providerAccountId ?? undefined; }
    }
    const out: { conversationId?: string; accountId?: string } = {};
    if (cid) out.conversationId = cid;
    if (aid) out.accountId = aid;
    return out;
  }
}
