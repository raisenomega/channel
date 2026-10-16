/**
 * HUB by Raisen — Approve draft handler (Slide 4.2b-2).
 * Valida draft existe, status=draft, aprobador mismo tenant -> approve. C4 ≤75.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";
import type { AgentDraft } from "../domain/agent-draft.entity.ts";
import type { AgentDraftsRepository } from "../infrastructure/agent-drafts.repository.ts";

export type ApproveError =
  | { readonly kind: "DRAFT_NOT_FOUND" }
  | { readonly kind: "STATUS_NOT_DRAFT"; readonly status: string }
  | { readonly kind: "REPO_ERROR"; readonly causa: string };

export class ApproveDraftHandler {
  constructor(private readonly repo: AgentDraftsRepository) {}

  async ejecutar(draftId: string, approver: string, editedContent?: string): Promise<Result<AgentDraft, ApproveError>> {
    const draft = await this.repo.obtenerPorId(draftId);
    if (!draft.ok) return err({ kind: "REPO_ERROR", causa: draft.error.causa });
    if (!draft.value) return err({ kind: "DRAFT_NOT_FOUND" });
    if (draft.value.status !== "draft") return err({ kind: "STATUS_NOT_DRAFT", status: draft.value.status });
    const r = await this.repo.aprobar(draftId, approver, editedContent);
    if (!r.ok) return err({ kind: "REPO_ERROR", causa: r.error.causa });
    const updated = await this.repo.obtenerPorId(draftId);
    return updated.ok && updated.value ? ok(updated.value) : err({ kind: "REPO_ERROR", causa: "read_back_failed" });
  }
}