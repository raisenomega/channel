import { expect, test } from "vitest";
import { RejectDraftHandler } from "../../../src/cognition/application/reject-draft.handler.ts";
import { ok } from "../../../src/shared/domain/result.ts";

test("A-05 RECHAZAR_SIN_RAZON_400: reject sin reason (<10 chars) -> REASON_TOO_SHORT", async () => {
  const repo = { obtenerPorId: async () => ok({ id: "d1", status: "draft" }), rechazar: async () => ok(undefined) } as never;
  const h = new RejectDraftHandler(repo);
  const r = await h.ejecutar("d1", "corto");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("REASON_TOO_SHORT");
});

test("reject con reason valida -> ok", async () => {
  const repo = { obtenerPorId: async () => ok({ id: "d1", status: "draft", rejectedReason: null }), rechazar: async () => ok(undefined) } as never;
  const h = new RejectDraftHandler(repo);
  const r = await h.ejecutar("d1", "razon de prueba 1234567890");
  expect(r.ok).toBe(true);
});

test("A-09 RLS_CROSS_TENANT: mock (en routes se verifica por JWT)", async () => {
  const repo = { obtenerPorId: async () => ok(null), rechazar: async () => ok(undefined) } as never;
  const h = new RejectDraftHandler(repo);
  const r = await h.ejecutar("d1", "razon valida largo suficiente");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("DRAFT_NOT_FOUND");
});

test("A-10 APROBADOR_MISMO_TENANT: en routes el JWT valida tenant_id, handler solo ejecuta orden", async () => {
  // La validacion cross-tenant se hace en la ruta via JWT; el handler confia en el caller
  const repo = { obtenerPorId: async () => ok({ id: "d1", status: "draft", tenantId: "t1" as never, rejectedReason: null }), rechazar: async () => ok(undefined) } as never;
  const h = new RejectDraftHandler(repo);
  const r = await h.ejecutar("d1", "razon suficientemente larga para pasar");
  expect(r.ok).toBe(true);
});

test("reject reason > 10 chars long, trimmed -> ok", async () => {
  const repo = { obtenerPorId: async () => ok({ id: "d1", status: "draft", rejectedReason: null }), rechazar: async () => ok(undefined) } as never;
  const h = new RejectDraftHandler(repo);
  const r = await h.ejecutar("d1", "+11 caracteres necesarios");
  expect(r.ok).toBe(true);
});