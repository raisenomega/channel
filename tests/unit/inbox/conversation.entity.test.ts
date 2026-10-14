import { expect, test } from "vitest";
import { crearConversacion, transicionarStatus } from "../../../src/inbox/domain/conversation.entity.ts";

const TID = crypto.randomUUID() as never;
const CID = crypto.randomUUID() as never;

test("crearConversacion â€” debe crear conversaciÃ³n open", () => {
  const result = crearConversacion(TID, CID, "whatsapp");
  expect(result.ok).toBe(true);
  expect(result.value.status).toBe("open");
  expect(result.value.primaryChannel).toBe("whatsapp");
  expect(result.value.operationMode).toBe("human");
  expect(result.value.totalMessages).toBe(0);
});

test("crearConversacion â€” debe fallar sin contacto", () => {
  const result = crearConversacion(TID, "" as never, "email");
  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("contacto_requerido");
});

test("transicionarStatus â€” open â†’ resolved permitido", () => {
  const result = transicionarStatus("open", "resolved");
  expect(result.ok).toBe(true);
});

test("transicionarStatus â€” resolved â†’ snoozed prohibido", () => {
  const result = transicionarStatus("resolved", "snoozed");
  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("transicion_invalida");
});

test("transicionarStatus â€” archived no puede ir a ningÃºn lado", () => {
  expect(!transicionarStatus("archived", "open").ok).toBe(true);
  expect(!transicionarStatus("archived", "resolved").ok).toBe(true);
  expect(!transicionarStatus("archived", "snoozed").ok).toBe(true);
});
