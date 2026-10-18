import { expect, test } from "vitest";
import { ApproveDraftHandler } from "../../../src/cognition/application/approve-draft.handler.ts";
import { ok } from "../../../src/shared/domain/result.ts";

const T = "t1" as never; // tenantId del aprobador (N-2)

test("A-01 APROBAR_DRAFT_INEXISTENTE_404: draftId falso -> DRAFT_NOT_FOUND", async () => {
  const repo = { obtenerPorId: async () => ok(null), aprobar: async () => ok(undefined) } as never;
  const h = new ApproveDraftHandler(repo);
  const r = await h.ejecutar("fake-id", T, "user-1");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("DRAFT_NOT_FOUND");
});

test("A-02 APROBAR_YA_APROBADO_409: approved 2x -> STATUS_NOT_DRAFT (conflict)", async () => {
  const repo = { obtenerPorId: async () => ok({ id: "d1", status: "approved", tenantId: "t1" }), aprobar: async () => ok(undefined) } as never;
  const h = new ApproveDraftHandler(repo);
  const r = await h.ejecutar("d1", T, "u1");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("STATUS_NOT_DRAFT");
});

test("A-03 APROBAR_YA_RECHAZADO_409: rejected -> approve -> STATUS_NOT_DRAFT", async () => {
  const repo = { obtenerPorId: async () => ok({ id: "d1", status: "rejected", tenantId: "t1" }), aprobar: async () => ok(undefined) } as never;
  const h = new ApproveDraftHandler(repo);
  const r = await h.ejecutar("d1", T, "u1");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("STATUS_NOT_DRAFT");
});

test("A-04 APROBAR_YA_ENVIADO_409: sent -> approve -> STATUS_NOT_DRAFT", async () => {
  const repo = { obtenerPorId: async () => ok({ id: "d1", status: "sent", tenantId: "t1" }), aprobar: async () => ok(undefined) } as never;
  const h = new ApproveDraftHandler(repo);
  const r = await h.ejecutar("d1", T, "u1");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("STATUS_NOT_DRAFT");
});

test("A-15 EDITED_CONTENT_SOBREESCRIBE: approve con editedContent -> actualiza draft_content", async () => {
  let savedEdited: string | undefined;
  const repo = {
    obtenerPorId: async (id: string) => ok({ id, status: "draft", tenantId: "t1", approvedBy: null, draftContent: id === "d1" ? "original" : "updated" }),
    aprobar: async (_id: string, _approver: string, edited?: string) => { savedEdited = edited; return ok(undefined); },
  } as never;
  const h = new ApproveDraftHandler(repo);
  const r = await h.ejecutar("d1", T, "u1", "texto editado");
  expect(r.ok).toBe(true);
  expect(savedEdited).toBe("texto editado");
});

test("happy: approve draft -> ok", async () => {
  const repo = { obtenerPorId: async () => ok({ id: "d1", status: "draft", tenantId: "t1", approvedBy: null, draftContent: "x" }), aprobar: async () => ok(undefined) } as never;
  const h = new ApproveDraftHandler(repo);
  const r = await h.ejecutar("d1", T, "user-1");
  expect(r.ok).toBe(true);
});

test("A-13 ANGEL_SIEMPRE_HOLD: draft angel status draft -> approve posible (validacion en supervisado-mode)", async () => {
  const repo = { obtenerPorId: async () => ok({ id: "d1", status: "draft", tenantId: "t1", approvedBy: null, draftContent: "x", personaSlug: "angel" }), aprobar: async () => ok(undefined) } as never;
  const h = new ApproveDraftHandler(repo);
  const r = await h.ejecutar("d1", T, "u1");
  expect(r.ok).toBe(true);
});

test("A-14 TRACE_ID_PROPAGADO_SEND: trace_id del draft llega al service (send usa repo.obtenerPorId)", async () => {
  const repo = { obtenerPorId: async () => ok({ id: "d1", status: "draft", tenantId: "t1", approvedBy: null, draftContent: "x", traceId: "trace_abc" }), aprobar: async () => ok(undefined) } as never;
  const h = new ApproveDraftHandler(repo);
  const r = await h.ejecutar("d1", T, "u1");
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value.traceId).toBe("trace_abc");
});

test("A-N-2 CROSS_TENANT: aprobar draft de otro tenant -> DRAFT_NOT_FOUND (no se filtra existencia)", async () => {
  // Draft pertenece al Tenant B; el aprobador es del Tenant A.
  const repo = { obtenerPorId: async () => ok({ id: "dB", status: "draft", tenantId: "tenantB", approvedBy: null, draftContent: "secreto B" }), aprobar: async () => ok(undefined) } as never;
  const h = new ApproveDraftHandler(repo);
  const r = await h.ejecutar("dB", "tenantA" as never, "u-attacker");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("DRAFT_NOT_FOUND");
});
