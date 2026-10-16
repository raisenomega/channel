/**
 * HUB by Raisen — Send approved draft (Slide 4.2b-2).
 * Envia mensaje aprobado via ChannelAdapter. Idempotente. C4 ≤75.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";
import type { AgentDraft } from "../domain/agent-draft.entity.ts";
import type { AgentDraftsRepository } from "../infrastructure/agent-drafts.repository.ts";
import type { ChannelAdapter } from "../../channels/domain/channel.adapter.ts";
import type { ChannelType } from "../../shared/domain/types.ts";

export type SendError =
  | { readonly kind: "DRAFT_NOT_FOUND" }
  | { readonly kind: "STATUS_NOT_APPROVED"; readonly status: string }
  | { readonly kind: "SEND_FAILED"; readonly causa: string }
  | { readonly kind: "REPO_ERROR"; readonly causa: string };

export class SendApprovedDraftService {
  constructor(private readonly repo: AgentDraftsRepository, private readonly adapter: ChannelAdapter) {}

  async ejecutar(draftId: string, to: string, channel: ChannelType): Promise<Result<AgentDraft, SendError>> {
    const draft = await this.repo.obtenerPorId(draftId);
    if (!draft.ok) return err({ kind: "REPO_ERROR", causa: draft.error.causa });
    if (!draft.value) return err({ kind: "DRAFT_NOT_FOUND" });
    if (draft.value.status === "sent") return ok(draft.value); // idempotente
    if (draft.value.status !== "approved") return err({ kind: "STATUS_NOT_APPROVED", status: draft.value.status });
    const r = await this.adapter.sendMessage({ to, content: draft.value.draftContent, channel });
    if (!r.ok) return err({ kind: "SEND_FAILED", causa: r.error.kind ?? String(r.error) });
    const pid = r.ok ? crypto.randomUUID() : ""; // placeholder hasta que adapter devuelva provider msg id
    const repoR = await this.repo.marcarEnviado(draftId, pid);
    if (!repoR.ok) return err({ kind: "REPO_ERROR", causa: repoR.error.causa });
    const updated = await this.repo.obtenerPorId(draftId);
    return updated.ok && updated.value ? ok(updated.value) : err({ kind: "REPO_ERROR", causa: "read_back_failed" });
  }
}