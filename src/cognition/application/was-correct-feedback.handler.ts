/**
 * HUB by Raisen — Was-correct feedback handler (Slide 4.2b-2).
 * Marca draft sent como was_correct. Idempotente: 2nd call -> 409 (ya tiene was_correct). C4 ≤75.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";
import type { AgentDraft } from "../domain/agent-draft.entity.ts";
import type { AgentDraftsRepository } from "../infrastructure/agent-drafts.repository.ts";

export type FeedbackError =
  | { readonly kind: "DRAFT_NOT_FOUND" }
  | { readonly kind: "STATUS_NOT_SENT"; readonly status: string }
  | { readonly kind: "ALREADY_HAS_FEEDBACK" }
  | { readonly kind: "REPO_ERROR"; readonly causa: string };

export class WasCorrectFeedbackHandler {
  constructor(private readonly repo: AgentDraftsRepository) {}

  async ejecutar(draftId: string, wasCorrect: boolean, note?: string): Promise<Result<AgentDraft, FeedbackError>> {
    const draft = await this.repo.obtenerPorId(draftId);
    if (!draft.ok) return err({ kind: "REPO_ERROR", causa: draft.error.causa });
    if (!draft.value) return err({ kind: "DRAFT_NOT_FOUND" });
    if (draft.value.status !== "sent") return err({ kind: "STATUS_NOT_SENT", status: draft.value.status });
    if (draft.value.wasCorrect !== null) return err({ kind: "ALREADY_HAS_FEEDBACK" });
    const r = await this.repo.registrarFeedback(draftId, wasCorrect, note);
    if (!r.ok) return err({ kind: "REPO_ERROR", causa: r.error.causa });
    const updated = await this.repo.obtenerPorId(draftId);
    return updated.ok && updated.value ? ok(updated.value) : err({ kind: "REPO_ERROR", causa: "read_back_failed" });
  }
}