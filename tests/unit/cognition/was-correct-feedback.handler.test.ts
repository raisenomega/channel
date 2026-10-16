import { expect, test } from "vitest";
import { WasCorrectFeedbackHandler } from "../../../src/cognition/application/was-correct-feedback.handler.ts";
import { ok } from "../../../src/shared/domain/result.ts";

test("A-11 WAS_CORRECT_SOLO_POST_SENT: status draft -> was-correct -> STATUS_NOT_SENT", async () => {
  const repo = { obtenerPorId: async () => ok({ id: "d1", status: "draft", wasCorrect: null }), registrarFeedback: async () => ok(undefined) } as never;
  const h = new WasCorrectFeedbackHandler(repo);
  const r = await h.ejecutar("d1", true);
  expect(r.ok).toBe(false);
  if (!r.ok) expect((r.error as { kind: string }).kind).toBe("STATUS_NOT_SENT");
});

test("A-12 WAS_CORRECT_IDEMPOTENTE: 2x feedback -> ALREADY_HAS_FEEDBACK", async () => {
  const repo = { obtenerPorId: async () => ok({ id: "d1", status: "sent", wasCorrect: true }), registrarFeedback: async () => ok(undefined) } as never;
  const h = new WasCorrectFeedbackHandler(repo);
  const r = await h.ejecutar("d1", false);
  expect(r.ok).toBe(false);
  if (!r.ok) expect((r.error as { kind: string }).kind).toBe("ALREADY_HAS_FEEDBACK");
});

test("sent + wasCorrect null -> ok", async () => {
  const repo = { obtenerPorId: async () => ok({ id: "d1", status: "sent", wasCorrect: null }), registrarFeedback: async () => ok(undefined) } as never;
  const h = new WasCorrectFeedbackHandler(repo);
  const r = await h.ejecutar("d1", true, "nota opcional");
  expect(r.ok).toBe(true);
});

test("draft not found -> DRAFT_NOT_FOUND", async () => {
  const repo = { obtenerPorId: async () => ok(null) } as never;
  const h = new WasCorrectFeedbackHandler(repo);
  const r = await h.ejecutar("fake", true);
  expect(r.ok).toBe(false);
  if (!r.ok) expect((r.error as { kind: string }).kind).toBe("DRAFT_NOT_FOUND");
});

test("was-correct true + note -> ok, nota guardada", async () => {
  let notaSalvada: string | undefined;
  const repo = {
    obtenerPorId: async () => ok({ id: "d1", status: "sent", wasCorrect: null }),
    registrarFeedback: async (_id: string, _wc: boolean, note?: string) => { notaSalvada = note; return ok(undefined); },
  } as never;
  const h = new WasCorrectFeedbackHandler(repo);
  const r = await h.ejecutar("d1", true, "nota de prueba");
  expect(r.ok).toBe(true);
  expect(notaSalvada).toBe("nota de prueba");
});