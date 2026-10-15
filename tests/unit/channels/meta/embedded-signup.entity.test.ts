import { expect, test } from "vitest";
import {
  EmbeddedSignupStatus,
  transicionarEstado,
  puedeIniciarSignup,
  STATUS_TRANSITIONS,
} from "../../../../src/channels/meta/domain/embedded-signup.entity.ts";

test("transicionarEstado: CREATED -> ATTEMPTED_REACH es valida", () => {
  const result = transicionarEstado("CREATED", "ATTEMPTED_REACH");
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.value).toBe("ATTEMPTED_REACH");
});

test("transicionarEstado: CREATED -> COMPLETED es valida (permite salto directo)", () => {
  const result = transicionarEstado("CREATED", "COMPLETED");
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.value).toBe("COMPLETED");
});

test("transicionarEstado: CREATED -> DELETED es invalida (salta estados)", () => {
  const result = transicionarEstado("CREATED", "DELETED");
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.kind).toBe("transicion_invalida");
});

test("transicionarEstado: ATTEMPTED_REACH -> COMPLETED es valida", () => {
  const result = transicionarEstado("ATTEMPTED_REACH", "COMPLETED");
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.value).toBe("COMPLETED");
});

test("transicionarEstado: COMPLETED -> PENDING_DELETE es valida", () => {
  const result = transicionarEstado("COMPLETED", "PENDING_DELETE");
  expect(result.ok).toBe(true);
});

test("transicionarEstado: PENDING_DELETE -> DELETED es valida", () => {
  const result = transicionarEstado("PENDING_DELETE", "DELETED");
  expect(result.ok).toBe(true);
});

test("transicionarEstado: COMPLETED -> DELETED es invalida (salta PENDING_DELETE)", () => {
  const result = transicionarEstado("COMPLETED", "DELETED");
  expect(result.ok).toBe(false);
});

test("transicionarEstado: COMPLETED -> CREATED es invalida (no retrocede)", () => {
  const result = transicionarEstado("COMPLETED", "CREATED");
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.kind).toBe("transicion_invalida");
});

test("transicionarEstado: estado origen desconocido retorna error", () => {
  const result = transicionarEstado("INEXISTENTE" as EmbeddedSignupStatus, "COMPLETED");
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.kind).toBe("transicion_invalida");
});

test("transicionarEstado: estado destino desconocido retorna error", () => {
  const result = transicionarEstado("CREATED", "INEXISTENTE" as EmbeddedSignupStatus);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.kind).toBe("transicion_invalida");
});

test("puedeIniciarSignup: tenant valido retorna ok", () => {
  const result = puedeIniciarSignup("tenant_abc");
  expect(result.ok).toBe(true);
});

test("puedeIniciarSignup: tenant vacio retorna tenant_requerido", () => {
  const result = puedeIniciarSignup("");
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.kind).toBe("tenant_requerido");
});

test("STATUS_TRANSITIONS tiene todos los estados como clave", () => {
  const estados: EmbeddedSignupStatus[] = [
    "CREATED", "ATTEMPTED_REACH", "COMPLETED", "PENDING_DELETE", "DELETED",
  ];
  for (const e of estados) {
    expect(STATUS_TRANSITIONS).toHaveProperty(e);
    expect(Array.isArray(STATUS_TRANSITIONS[e])).toBe(true);
  }
});

test("STATUS_TRANSITIONS: DELETED no permite transiciones", () => {
  expect(STATUS_TRANSITIONS["DELETED"]).toHaveLength(0);
});