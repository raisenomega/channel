import { expect, test, vi } from "vitest";
import { SyncTemplateStatusHandler } from "../../../src/templates/application/sync-template-status.handler.ts";
import { ok, err } from "../../../src/shared/domain/result.ts";

function repoMock() {
  const calls: Array<{ id: string; status: string; reason?: string }> = [];
  return {
    buscarPorNombre: vi.fn(),
    actualizarStatus: vi.fn(async (id: string, status: string, reason?: string) => { calls.push({ id, status, reason }); return ok(undefined); }),
    _calls: calls,
  } as never;
}

test("APPROVED actualiza status", async () => {
  const r = repoMock();
  r.buscarPorNombre.mockResolvedValue(ok([{ id: "t1", name: "bienvenida", language: "en" }]));
  const h = new SyncTemplateStatusHandler(r);
  const res = await h.ejecutar({ nombre: "bienvenida", language: "en", status: "APPROVED", reason: undefined });
  expect(res.ok).toBe(true);
  if (res.ok) expect(res.value).toBe(1);
  expect(r._calls.length).toBe(1);
  expect(r._calls[0]).toEqual({ id: "t1", status: "approved", reason: undefined });
});

test("status_desconocido para status no soportado", async () => {
  const r = repoMock();
  const h = new SyncTemplateStatusHandler(r);
  const res = await h.ejecutar({ nombre: "x", language: "", status: "PENDING" as never, reason: undefined });
  expect(res.ok).toBe(false);
  if (!res.ok) expect(res.error.kind).toBe("status_desconocido");
});

test("template_no_encontrado si no hay coincidencias", async () => {
  const r = repoMock();
  r.buscarPorNombre.mockResolvedValue(ok([]));
  const h = new SyncTemplateStatusHandler(r);
  const res = await h.ejecutar({ nombre: "inexistente", language: "", status: "REJECTED", reason: "spam" });
  expect(res.ok).toBe(false);
  if (!res.ok) expect(res.error.kind).toBe("template_no_encontrado");
});