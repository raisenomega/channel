import { expect, test, vi } from "vitest";
import { ListTemplatesQuery } from "../../../src/templates/application/list-templates.query.ts";
import { ok, err } from "../../../src/shared/domain/result.ts";

test("returns templates + syncFailed false", async () => {
  const repo = {
    buscarPorTenant: vi.fn().mockResolvedValue(ok(Object.freeze([{ id: "t1", name: "a", status: "approved" }]))),
  } as never;
  const q = new ListTemplatesQuery(repo);
  const r = await q.ejecutar("t1" as never);
  expect(r.ok).toBe(true);
  if (r.ok) {
    expect(r.value.templates.length).toBe(1);
    expect(r.value.templates[0].name).toBe("a");
    expect(r.value.syncFailed).toBe(false);
  }
});

test("persistence_failure en error de repo", async () => {
  const repo = {
    buscarPorTenant: vi.fn().mockResolvedValue(err({ kind: "persistence_failure", cause: "db down" })),
  } as never;
  const q = new ListTemplatesQuery(repo);
  const r = await q.ejecutar("t1" as never);
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("persistence_failure");
});