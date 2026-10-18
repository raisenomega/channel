/**
 * HUB by Raisen — Approve draft handler (Slide 4.2b-2).
 * Valida draft existe, status=draft, aprobador mismo tenant -> approve. C4 ≤75.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";
import type { TenantId } from "../../shared/domain/ids.ts";
import type { AgentDraft } from "../domain/agent-draft.entity.ts";
import type { AgentDraftsRepository } from "../infrastructure/agent-drafts.repository.ts";

export type ApproveError =
  | { readonly kind: "DRAFT_NOT_FOUND" }
  | { readonly kind: "STATUS_NOT_DRAFT"; readonly status: string }
  | { readonly kind: "REPO_ERROR"; readonly causa: string };

export class ApproveDraftHandler {
  constructor(private readonly repo: AgentDraftsRepository) {}

  async ejecutar(draftId: string, tenantId: TenantId, approver: string, editedContent?: string): Promise<Result<AgentDraft, ApproveError>> {
    const draft = await this.repo.obtenerPorId(draftId);
    if (!draft.ok) return err({ kind: "REPO_ERROR", causa: draft.error.causa });
    // N-2: aislamiento por tenant. Si el draft no es del tenant del aprobador, se trata
    // como NOT_FOUND (no se filtra la existencia de drafts de otros tenants).
    if (!draft.value || draft.value.tenantId !== tenantId) return err({ kind: "DRAFT_NOT_FOUND" });
    if (draft.value.status !== "draft") return err({ kind: "STATUS_NOT_DRAFT", status: draft.value.status });
    const r = await this.repo.aprobar(draftId, approver, editedContent);
    if (!r.ok) return err({ kind: "REPO_ERROR", causa: r.error.causa });
    const updated = await this.repo.obtenerPorId(draftId);
    return updated.ok && updated.value ? ok(updated.value) : err({ kind: "REPO_ERROR", causa: "read_back_failed" });
  }
}