/**
 * HUB by Raisen — Rutas de drafts supervisados (Slide 4.2b-2).
 * POST approve/reject/was-correct, GET pending. JWT path, tenantId del claim. C4 ≤75.
 * Hotfix G: requireTenantAuth (antes extractJwt+parsearJwtClaims eran incompatibles y
 * SIEMPRE denegaban). Ademas exige tenant del path == claim (403 tenant_mismatch, R20).
 */
import type { RouteDefinition, RequestContext } from "../../server/server-types.ts";
import { requireTenantAuth } from "../../server/auth-helpers.ts";
import { tid } from "../../server/server-types.ts";
import type { ApproveDraftHandler } from "../application/approve-draft.handler.ts";
import type { RejectDraftHandler } from "../application/reject-draft.handler.ts";
import type { SendApprovedDraftService } from "../application/send-approved-draft.service.ts";
import type { WasCorrectFeedbackHandler } from "../application/was-correct-feedback.handler.ts";
import type { AgentDraftsRepository } from "../infrastructure/agent-drafts.repository.ts";
import { aprobarYEnviar } from "./drafts-approve-send.ts";
import { registrarAprendizaje } from "../application/draft-feedback.ts";
import type { CerebroEvent } from "../../integrations/domain/cerebro.types.ts";

export interface DraftsDeps {
  readonly approve: ApproveDraftHandler;
  readonly reject: RejectDraftHandler;
  readonly send: SendApprovedDraftService;
  readonly feedback: WasCorrectFeedbackHandler;
  readonly repo: AgentDraftsRepository;
  readonly emit?: (e: CerebroEvent) => void; // #2: aprendizaje a CEREBRO (fire-and-forget)
}

const cp = (c: RequestContext) => c.path.split("/");
const pathTenant = (c: RequestContext): string => c.params["id"] ?? cp(c)[2] ?? "";
const kindOf = (e: unknown): string => (e as { kind: string }).kind;

export function rutaDraftsPending(deps: DraftsDeps): RouteDefinition {
  return { method: "GET", path: "/tenants/:id/drafts/pending", handler: async (ctx) => {
    const auth = await requireTenantAuth(ctx, pathTenant(ctx)); if (!auth.ok) return auth.error;
    const r = await deps.repo.listarPendientes(tid(auth.value.tenantId) as never);
    return r.ok ? { ok: true, drafts: r.value } : { ok: false, error: { kind: "persistence_error" } };
  } };
}

export function rutaDraftsApprove(deps: DraftsDeps): RouteDefinition {
  return { method: "POST", path: "/tenants/:id/drafts/:draftId/approve", handler: async (ctx) => {
    const auth = await requireTenantAuth(ctx, pathTenant(ctx)); if (!auth.ok) return auth.error;
    const draftId = ctx.params["draftId"] ?? cp(ctx)[4] ?? "";
    const r = await aprobarYEnviar(deps.approve, deps.send, draftId, tid(auth.value.tenantId), auth.value.userId, (ctx.body ?? {}) as Record<string, unknown>);
    if (r.ok && r.draft) void registrarAprendizaje(deps.repo, deps.emit, r.draft, true); // #2 aprendizaje
    return r;
  } };
}
export function rutaDraftsReject(deps: DraftsDeps): RouteDefinition {
  return { method: "POST", path: "/tenants/:id/drafts/:draftId/reject", handler: async (ctx) => {
    const auth = await requireTenantAuth(ctx, pathTenant(ctx)); if (!auth.ok) return auth.error;
    const draftId = ctx.params["draftId"] ?? cp(ctx)[4] ?? "";
    const reason = String(((ctx.body ?? {}) as Record<string, unknown>)["reason"] ?? "");
    if (reason.length < 10) return { ok: false, error: { kind: "reason_too_short" }, status: 400 };
    const r = await deps.reject.ejecutar(draftId, reason);
    if (r.ok) { void registrarAprendizaje(deps.repo, deps.emit, r.value, false); return { ok: true, draft: r.value }; } // #2 aprendizaje
    if (kindOf(r.error) === "DRAFT_NOT_FOUND") return { ok: false, error: { kind: "not_found" }, status: 404 };
    if (kindOf(r.error) === "STATUS_NOT_DRAFT") return { ok: false, error: { kind: "conflict" }, status: 409 };
    return { ok: false, error: { kind: "persistence_error" } };
  } };
}

export function rutaDraftsWasCorrect(deps: DraftsDeps): RouteDefinition {
  return { method: "POST", path: "/tenants/:id/drafts/:draftId/was-correct", handler: async (ctx) => {
    const auth = await requireTenantAuth(ctx, pathTenant(ctx)); if (!auth.ok) return auth.error;
    const draftId = ctx.params["draftId"] ?? cp(ctx)[4] ?? "";
    const body = (ctx.body ?? {}) as Record<string, unknown>;
    const r = await deps.feedback.ejecutar(draftId, body.wasCorrect === true, (body as { note?: string }).note);
    if (r.ok) return { ok: true, draft: r.value };
    if (kindOf(r.error) === "DRAFT_NOT_FOUND") return { ok: false, error: { kind: "not_found" }, status: 404 };
    if (kindOf(r.error) === "ALREADY_HAS_FEEDBACK") return { ok: false, error: { kind: "conflict" }, status: 409 };
    if (kindOf(r.error) === "STATUS_NOT_SENT") return { ok: false, error: { kind: "bad_request" }, status: 400 };
    return { ok: false, error: { kind: "persistence_error" } };
  } };
}
