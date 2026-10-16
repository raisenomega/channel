import { expect, test, vi } from "vitest";
import { PersistDraftHandler } from "../../../src/cognition/application/persist-draft.handler.ts";
import { ok, err } from "../../../src/shared/domain/result.ts";

const TID = "tenant-A" as never;
const CID = "conv-1" as never;
const COID = "contact-1" as never;

const baseCmd = { tenantId: TID, conversationId: CID, contactId: COID, personaSlug: "victor", inboundMessage: "Hola", draftContent: "Respuesta draft", confidence: 0.5, reason: "confidence_below_threshold", aiDisclosureIncluded: true, traceId: "trace_abc" };

test("A-01 DRAFT_PERSISTE_STATUS_DRAFT: handler guarda con status draft", async () => {
  const repo = { insertar: async (d: { status: string }) => ok({ ...d, status: d.status }) } as never;
  const h = new PersistDraftHandler(repo);
  const r = await h.ejecutar(baseCmd);
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value.status).toBe("draft");
});

test("A-09 PERSONA_INVALIDA_RECHAZO: slug pedrito -> PERSONA_INVALIDA", async () => {
  const repo = { insertar: async () => ok({}) } as never;
  const h = new PersistDraftHandler(repo);
  const r = await h.ejecutar({ ...baseCmd, personaSlug: "pedrito" });
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("PERSONA_INVALIDA");
});

test("A-13 TRACE_ID_PROPAGADO: traceId llega al draft persistido", async () => {
  const repo = { insertar: async (d: { traceId: string; status: string }) => ok({ ...d, status: d.status }) } as never;
  const h = new PersistDraftHandler(repo);
  const r = await h.ejecutar(baseCmd);
  if (r.ok) expect(r.value.traceId).toBe("trace_abc");
});

test("A-14 METADATA_SUPERVISADO_FLAG: metadata.supervisado=true siempre tras persist", async () => {
  const repo = { insertar: async (d: { metadata: Record<string, unknown>; status: string }) => ok({ ...d, status: d.status }) } as never;
  const h = new PersistDraftHandler(repo);
  const r = await h.ejecutar(baseCmd);
  if (r.ok) {
    const m = r.value.metadata as Record<string, unknown>;
    expect(m.supervisado).toBe(true);
  }
});

test("repo error -> REPO_ERROR", async () => {
  const repo = { insertar: async () => err({ causa: "db_down" }) } as never;
  const h = new PersistDraftHandler(repo);
  const r = await h.ejecutar(baseCmd);
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("REPO_ERROR");
});