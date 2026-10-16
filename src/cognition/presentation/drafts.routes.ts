/**
 * HUB by Raisen — Rutas de drafts supervisados (Slide 4.2b-2).
 * POST approve/reject/was-correct, GET pending. JWT path, tenantId del claim. C4 ≤75.
 */
import type { RouteDefinition, RequestContext } from "../../server/server-types.ts";
import { parsearJwtClaims } from "../../server/jwt-verify.ts";
import { tid } from "../../server/server-types.ts";
import { extractJwt } from "../../server/server-helpers.ts";
import type { ApproveDraftHandler } from "../application/approve-draft.handler.ts";
import type { RejectDraftHandler } from "../application/reject-draft.handler.ts";
import type { SendApprovedDraftService } from "../application/send-approved-draft.service.ts";
import type { WasCorrectFeedbackHandler } from "../application/was-correct-feedback.handler.ts";
import type { AgentDraftsRepository } from "../infrastructure/agent-drafts.repository.ts";

export interface DraftsDeps {
  readonly approve: ApproveDraftHandler;
  readonly reject: RejectDraftHandler;
  readonly send: SendApprovedDraftService;
  readonly feedback: WasCorrectFeedbackHandler;
  readonly repo: AgentDraftsRepository;
}

async function tenantId(ctx: RequestContext): Promise<string | null> {
  const claims = await parsearJwtClaims(extractJwt(ctx.headers));
  return claims.ok ? tid(claims.value.tenantId) : null;
}
const cp = (c: RequestContext) => c.path.split("/");
export function rutaDraftsPending(deps: DraftsDeps): RouteDefinition {
  return { method: "GET", path: "/tenants/:id/drafts/pending", handler: async (ctx) => {
    const tid2 = await tenantId(ctx); if (!tid2) return { ok: false, error: { kind: "token_ausente" } };
    const r = await deps.repo.listarPendientes(tid2 as never);
    return r.ok ? { ok: true, drafts: r.value } : { ok: false, error: { kind: "persistence_error" } };
  } };
}

export function rutaDraftsApprove(deps: DraftsDeps): RouteDefinition {
  return { method: "POST", path: "/tenants/:id/drafts/:draftId/approve", handler: async (ctx) => {
    const tid2 = await tenantId(ctx); if (!tid2) return { ok: false, error: { kind: "token_ausente" } };
    const draftId = cp(ctx)[4] ?? "";
    const body = (ctx.body ?? {}) as Record<string, unknown>;
    const r = await deps.approve.ejecutar(draftId, tid2, (body as { editedContent?: string }).editedContent);
    if (r.ok) return { ok: true, draft: r.value };
    if ((r.error as { kind: string }).kind === "DRAFT_NOT_FOUND") return { ok: false, error: { kind: "not_found" }, status: 404 };
    if ((r.error as { kind: string }).kind === "STATUS_NOT_DRAFT") return { ok: false, error: { kind: "conflict" }, status: 409 };
    return { ok: false, error: { kind: "persistence_error" } };
  } };
}
export function rutaDraftsReject(deps: DraftsDeps): RouteDefinition {
  return { method: "POST", path: "/tenants/:id/drafts/:draftId/reject", handler: async (ctx) => {
    const tid2 = await tenantId(ctx); if (!tid2) return { ok: false, error: { kind: "token_ausente" } };
    const draftId = cp(ctx)[4] ?? "";
    const reason = String(((ctx.body ?? {}) as Record<string, unknown>)["reason"] ?? "");
    if (reason.length < 10) return { ok: false, error: { kind: "reason_too_short" }, status: 400 };
    const r = await deps.reject.ejecutar(draftId, reason);
    if (r.ok) return { ok: true, draft: r.value };
    if ((r.error as { kind: string }).kind === "DRAFT_NOT_FOUND") return { ok: false, error: { kind: "not_found" }, status: 404 };
    if ((r.error as { kind: string }).kind === "STATUS_NOT_DRAFT") return { ok: false, error: { kind: "conflict" }, status: 409 };
    return { ok: false, error: { kind: "persistence_error" } };
  } };
}

export function rutaDraftsWasCorrect(deps: DraftsDeps): RouteDefinition {
  return { method: "POST", path: "/tenants/:id/drafts/:draftId/was-correct", handler: async (ctx) => {
    const tid2 = await tenantId(ctx); if (!tid2) return { ok: false, error: { kind: "token_ausente" } };
    const draftId = cp(ctx)[4] ?? "";
    const body = (ctx.body ?? {}) as Record<string, unknown>;
    const wasCorrect = body.wasCorrect === true;
    const r = await deps.feedback.ejecutar(draftId, wasCorrect, (body as { note?: string }).note);
    if (r.ok) return { ok: true, draft: r.value };
    if ((r.error as { kind: string }).kind === "DRAFT_NOT_FOUND") return { ok: false, error: { kind: "not_found" }, status: 404 };
    if ((r.error as { kind: string }).kind === "ALREADY_HAS_FEEDBACK") return { ok: false, error: { kind: "conflict" }, status: 409 };
    if ((r.error as { kind: string }).kind === "STATUS_NOT_SENT") return { ok: false, error: { kind: "bad_request" }, status: 400 };
    return { ok: false, error: { kind: "persistence_error" } };
  } };
}