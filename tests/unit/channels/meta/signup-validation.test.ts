import { expect, test } from "vitest";
import { validarSignupWebhook } from "../../../../src/channels/meta/application/signup-validation.ts";

test("payload valido con datos minimos retorna ok", () => {
  const result = validarSignupWebhook({ id: "sig_123", status: "CREATED" });
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value.id).toBe("sig_123");
    expect(result.value.status).toBe("CREATED");
  }
});

test("payload nulo retorna id_vacio", () => {
  const result = validarSignupWebhook(null);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.kind).toBe("id_vacio");
});

test("payload sin id retorna id_vacio", () => {
  const result = validarSignupWebhook({ status: "CREATED" });
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.kind).toBe("id_vacio");
});

test("payload con id vacio retorna id_vacio", () => {
  const result = validarSignupWebhook({ id: "  ", status: "CREATED" });
  expect(result.ok).toBe(false);
});

test("status desconocido retorna status_invalido", () => {
  const result = validarSignupWebhook({ id: "sig_1", status: "BOGUS" });
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.kind).toBe("status_invalido");
});

test("COMPLETED con waba_id + phone_number_id + access_token valida", () => {
  const result = validarSignupWebhook({
    id: "sig_2",
    status: "COMPLETED",
    waba_id: "123456",
    phone_number_id: "789012",
    access_token: "EAAdummy",
  });
  expect(result.ok).toBe(true);
});

test("COMPLETED sin waba_id retorna waba_sin_phone", () => {
  const result = validarSignupWebhook({
    id: "sig_3",
    status: "COMPLETED",
    phone_number_id: "789012",
    access_token: "EAAdummy",
  });
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.kind).toBe("waba_sin_phone");
});

test("COMPLETED sin phone_number_id retorna waba_sin_phone", () => {
  const result = validarSignupWebhook({
    id: "sig_4",
    status: "COMPLETED",
    waba_id: "123456",
    access_token: "EAAdummy",
  });
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.kind).toBe("waba_sin_phone");
});

test("COMPLETED sin access_token retorna token_incompleto", () => {
  const result = validarSignupWebhook({
    id: "sig_5",
    status: "COMPLETED",
    waba_id: "123456",
    phone_number_id: "789012",
  });
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.kind).toBe("token_incompleto");
});

test("COMPLETED con access_token vacio retorna token_incompleto", () => {
  const result = validarSignupWebhook({
    id: "sig_6",
    status: "COMPLETED",
    waba_id: "123456",
    phone_number_id: "789012",
    access_token: "",
  });
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.kind).toBe("token_incompleto");
});

test("payload con datos extra se ignoran (no rompen)", () => {
  const result = validarSignupWebhook({
    id: "sig_7",
    status: "ATTEMPTED_REACH",
    campo_extra: "xyz",
  });
  expect(result.ok).toBe(true);
});

test("payload con recipient_phone_number se mapea correctamente", () => {
  const result = validarSignupWebhook({
    id: "sig_8",
    status: "CREATED",
    recipient_phone_number: "+521234567890",
  });
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value.recipient_phone_number).toBe("+521234567890");
  }
});

test("ATTEMPTED_REACH valido sin campos opcionales", () => {
  const result = validarSignupWebhook({ id: "sig_9", status: "ATTEMPTED_REACH" });
  expect(result.ok).toBe(true);
});