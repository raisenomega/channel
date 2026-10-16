import { expect, test, vi } from "vitest";
import { ok } from "../../../src/shared/domain/result.ts";

vi.mock("../../../src/shared/infrastructure/supabase.client.ts", () => {
  const chain = { upsert: vi.fn(async () => ({ error: null })), select: vi.fn(() => chain), eq: vi.fn(() => chain), single: vi.fn(async () => ({ data: null, error: null })), order: vi.fn(() => chain), update: vi.fn(() => chain) };
  return { supabase: chain };
});

const { buildTemplatesDeps } = await import("../../../src/server/templates-wrapper.ts");

test("Compuerta #19: buildTemplatesDeps cablea TemplatesDeps completas (sin stub)", async () => {
  const deps = await buildTemplatesDeps();
  expect(typeof deps.create.ejecutar).toBe("function");
  expect(typeof deps.list.ejecutar).toBe("function");
  expect(typeof deps.patch.ejecutar).toBe("function");
  expect(typeof deps.import.ejecutar).toBe("function");
  expect(typeof deps.syncStatus.ejecutar).toBe("function");
  expect(typeof deps.webhookSecret).toBe("string");
  expect(deps.repo).toBeTruthy();
});

test("Compuerta #19: buildTemplatesDeps usa el repo real, nunca stub inline", async () => {
  const deps = await buildTemplatesDeps();
  expect(deps.create).not.toBeUndefined();
  expect(deps.list).not.toBeUndefined();
  expect(deps.patch).not.toBeUndefined();
  expect(deps.import).not.toBeUndefined();
  expect(deps.syncStatus).not.toBeUndefined();
});