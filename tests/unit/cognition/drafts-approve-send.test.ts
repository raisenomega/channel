/**
 * HUB by Raisen — S2: aprobar -> enviar (si hay destino). Sin destino: aprueba pero NO envia (honesto).
 */
import { expect, test } from "vitest";
import { aprobarYEnviar } from "../../../src/cognition/presentation/drafts-approve-send.ts";
import type { ApproveDraftHandler } from "../../../src/cognition/application/approve-draft.handler.ts";
import type { SendApprovedDraftService } from "../../../src/cognition/application/send-approved-draft.service.ts";
import type { AgentDraft } from "../../../src/cognition/domain/agent-draft.entity.ts";
import type { TenantId } from "../../../src/shared/domain/ids.ts";
import { ok, err } from "../../../src/shared/domain/result.ts";

const mkDraft = (meta: Record<string, unknown>): AgentDraft => ({ id: "d1", status: "approved", draftContent: "hola", metadata: meta } as unknown as AgentDraft);
const approveOK = (d: AgentDraft) => ({ ejecutar: async () => ok(d) } as unknown as ApproveDraftHandler);
const approveFail = (kind: string) => ({ ejecutar: async () => err({ kind }) } as unknown as ApproveDraftHandler);
const sendSpy = (calls: string[]) => ({ ejecutar: async (id: string, to: string, ch: string) => { calls.push(`${id}|${to}|${ch}`); return ok(mkDraft({})); } } as unknown as SendApprovedDraftService);
const T = "t1" as unknown as TenantId;

test("S2-01 metadata con to/channel -> envia (sent:true)", async () => {
  const calls: string[] = [];
  const r = await aprobarYEnviar(approveOK(mkDraft({ to: "+1787", channel: "whatsapp" })), sendSpy(calls), "d1", T, "u1", {});
  expect(r.ok).toBe(true); expect(r.sent).toBe(true); expect(calls).toEqual(["d1|+1787|whatsapp"]);
});

test("S2-02 sin destino -> aprueba pero NO envia (honesto)", async () => {
  const calls: string[] = [];
  const r = await aprobarYEnviar(approveOK(mkDraft({})), sendSpy(calls), "d1", T, "u1", {});
  expect(r.ok).toBe(true); expect(r.sent).toBe(false); expect(calls).toEqual([]);
});

test("S2-03 approve falla DRAFT_NOT_FOUND -> 404, no envia", async () => {
  const calls: string[] = [];
  const r = await aprobarYEnviar(approveFail("DRAFT_NOT_FOUND"), sendSpy(calls), "d1", T, "u1", {});
  expect(r.ok).toBe(false); expect(r.status).toBe(404); expect(calls).toEqual([]);
});
