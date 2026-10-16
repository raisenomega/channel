import { expect, test } from "vitest";
import { SendApprovedDraftService } from "../../../src/cognition/application/send-approved-draft.service.ts";
import { ok, err } from "../../../src/shared/domain/result.ts";

const routerOk = { enviar: async () => ok(undefined) } as never;
const routerFail = { enviar: async () => err({ kind: "provider_unavailable" }) } as never;

test("A-06 SEND_IDEMPOTENTE: send 2x con mismo approved draft -> segunda no reenvia", async () => {
  let status = "approved";
  let sendCalls = 0;
  const repo = {
    obtenerPorId: async () => ok({ id: "d1", status, draftContent: "msg", providerMessageId: null, sentAt: null }),
    marcarEnviado: async () => { sendCalls++; status = "sent"; return ok(undefined); },
  } as never;
  const s = new SendApprovedDraftService(repo, routerOk);
  const r1 = await s.ejecutar("d1", "+1787", "whatsapp");
  expect(r1.ok).toBe(true);
  const r2 = await s.ejecutar("d1", "+1787", "whatsapp");
  expect(r2.ok).toBe(true);
  if (r2.ok) expect(r2.value.status).toBe("sent");
  // solo 1 send (la 2da es idempotente, status era "sent")
  expect(sendCalls).toBe(1);
});

test("A-07 SEND_FALLA_ADAPTER_QUEDA_APPROVED: adapter error -> status queda approved", async () => {
  const repo = {
    obtenerPorId: async () => ok({ id: "d1", status: "approved", draftContent: "msg" }),
    marcarEnviado: async () => ok(undefined),
  } as never;
  const s = new SendApprovedDraftService(repo, routerFail);
  const r = await s.ejecutar("d1", "+1787", "whatsapp");
  expect(r.ok).toBe(false);
});

test("A-08 SEND_EXITOSO_SETEA_PROVIDER_MSG_ID: send ok -> status sent + provider_message_id guardado", async () => {
  let pidSalvado: string | undefined;
  const repo = {
    obtenerPorId: async () => ok({ id: "d1", status: "approved", draftContent: "msg", providerMessageId: null, sentAt: null }),
    marcarEnviado: async (_id: string, pid: string) => { pidSalvado = pid; return ok(undefined); },
  } as never;
  const s = new SendApprovedDraftService(repo, routerOk);
  const r = await s.ejecutar("d1", "+1787", "whatsapp");
  expect(r.ok).toBe(true);
  expect(typeof pidSalvado).toBe("string");
  expect(pidSalvado.length).toBeGreaterThan(0);
});

test("draft no encontrado -> DRAFT_NOT_FOUND", async () => {
  const repo = { obtenerPorId: async () => ok(null) } as never;
  const s = new SendApprovedDraftService(repo, routerOk);
  const r = await s.ejecutar("fake", "+1787", "whatsapp");
  expect(r.ok).toBe(false);
  if (!r.ok) expect((r.error as { kind: string }).kind).toBe("DRAFT_NOT_FOUND");
});
