/**
 * HUB by Raisen — S2: aprobar un draft y, si tiene destino, ENVIARLO (supervisado end-to-end).
 * `to`/`channel` salen del metadata del draft (los pone el productor en S3) o del body. Si faltan,
 * aprueba sin enviar (honesto: no inventa destino). C4 <=75. Sin any.
 */
import type { ApproveDraftHandler } from "../application/approve-draft.handler.ts";
import type { SendApprovedDraftService } from "../application/send-approved-draft.service.ts";
import type { AgentDraft } from "../domain/agent-draft.entity.ts";
import type { TenantId } from "../../shared/domain/ids.ts";
import type { ChannelType } from "../../shared/domain/types.ts";

export interface AprobarEnviarResp {
  readonly ok: boolean;
  readonly draft?: AgentDraft;
  readonly sent?: boolean;
  readonly sendError?: string;
  readonly error?: { readonly kind: string };
  readonly status?: number;
  readonly [k: string]: unknown; // compat con RouteHandlerResult (Record<string, unknown>)
}

const kindOf = (e: unknown): string => (e as { kind: string }).kind;

export async function aprobarYEnviar(
  approve: ApproveDraftHandler, send: SendApprovedDraftService,
  draftId: string, tenantId: TenantId, userId: string, body: Record<string, unknown>,
): Promise<AprobarEnviarResp> {
  const r = await approve.ejecutar(draftId, tenantId, userId, (body as { editedContent?: string }).editedContent);
  if (!r.ok) {
    const k = kindOf(r.error);
    if (k === "DRAFT_NOT_FOUND") return { ok: false, error: { kind: "not_found" }, status: 404 };
    if (k === "STATUS_NOT_DRAFT") return { ok: false, error: { kind: "conflict" }, status: 409 };
    return { ok: false, error: { kind: "persistence_error" } };
  }
  const draft = r.value;
  const meta = draft.metadata as { to?: string; channel?: string; contactLabel?: string; contactPhone?: string };
  const to = String((body["to"] as string) ?? meta.to ?? meta.contactLabel ?? meta.contactPhone ?? ""); // el autodraft guarda contactLabel (= cliente), no "to"
  const channel = String((body["channel"] as string) ?? meta.channel ?? "");
  if (!to || !channel) return { ok: true, draft, sent: false }; // aprobado; sin destino no se envia
  const s = await send.ejecutar(draftId, to, channel as ChannelType);
  if (s.ok) return { ok: true, draft: s.value, sent: true };
  return { ok: true, draft, sent: false, sendError: kindOf(s.error) };
}
