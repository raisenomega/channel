import { expect, test } from "vitest";
import { crearInbox, activarInbox, desactivarInbox } from "../../../src/channels/domain/inbox.entity.ts";

const TEST_TENANT = crypto.randomUUID() as never;

test("crearInbox â€” debe crear inbox vÃ¡lido", () => {
  const result = crearInbox("WhatsApp Principal", "whatsapp", "zernio", TEST_TENANT);
  expect(result.ok).toBe(true);
  expect(result.value.name).toBe("WhatsApp Principal");
  expect(result.value.channelType).toBe("whatsapp");
  expect(result.value.provider).toBe("zernio");
  expect(result.value.isActive).toBe(false);
  expect(result.value.syncStatus).toBe("pending");
});

test("crearInbox â€” debe fallar con nombre vacÃ­o", () => {
  const result = crearInbox("", "email", "resend", TEST_TENANT);
  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("nombre_vacio");
});

test("crearInbox â€” debe fallar con provider invÃ¡lido", () => {
  const result = crearInbox("Test", "webchat", "fake_provider" as never, TEST_TENANT);
  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("provider_no_soportado");
});

test("activarInbox â€” debe activar y cambiar syncStatus", () => {
  const r = crearInbox("Test", "email", "resend", TEST_TENANT);
  expect(r.ok).toBe(true);
  const activo = activarInbox(r.value);
  expect(activo.isActive).toBe(true);
  expect(activo.syncStatus).toBe("connected");
});

test("desactivarInbox â€” debe desactivar y cambiar syncStatus", () => {
  const r = crearInbox("Test", "telegram", "zernio", TEST_TENANT);
  expect(r.ok).toBe(true);
  const inactivo = desactivarInbox(r.value);
  expect(inactivo.isActive).toBe(false);
  expect(inactivo.syncStatus).toBe("disconnected");
});
