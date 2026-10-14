import { expect, test } from "vitest";
import { InitSignupHandler, InitSignupCommand } from "../../../../src/channels/meta/application/init-signup.handler.ts";

test("ejecutar genera URL OAuth con parametros basicos", async () => {
  const cmd: InitSignupCommand = {
    tenantId: "tenant_abc",
    callbackUrl: "https://example.com/callback",
    appId: "123456789",
    state: "csrf_state_abc",
  };
  const handler = new InitSignupHandler();
  const result = await handler.ejecutar(cmd);
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value.url).toContain("https://www.facebook.com/v22.0/dialog/embedded_signup");
    expect(result.value.url).toContain("app_id=123456789");
    expect(result.value.url).toContain("redirect_uri=");
    expect(result.value.url).toContain("state=");
    expect(result.value.state).toBe("csrf_state_abc");
  }
});

test("ejecutar incluye scopes solicitados en la URL", async () => {
  const cmd: InitSignupCommand = {
    tenantId: "tenant_xyz",
    callbackUrl: "https://app.com/meta/callback",
    appId: "987654321",
    state: "csrf_xyz",
  };
  const handler = new InitSignupHandler();
  const result = await handler.ejecutar(cmd);
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value.url).toContain("scope=");
  }
});

test("ejecutar URL contiene state como parametro CSRF", async () => {
  const cmd: InitSignupCommand = {
    tenantId: "tenant_1",
    callbackUrl: "https://example.com/meta/cb",
    appId: "555555",
    state: "csrf_123",
  };
  const handler = new InitSignupHandler();
  const result = await handler.ejecutar(cmd);
  expect(result.ok).toBe(true);
  if (result.ok) {
    const url = new URL(result.value.url);
    expect(url.searchParams.get("state")).toBe("csrf_123");
  }
});

test("ejecutar lanza error si tenantId es vacio", async () => {
  const cmd: InitSignupCommand = {
    tenantId: "",
    callbackUrl: "https://example.com/cb",
    appId: "123456",
    state: "csrf_err",
  };
  const handler = new InitSignupHandler();
  const result = await handler.ejecutar(cmd);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.kind).toBe("tenant_requerido");
});

test("ejecutar lanza error si appId es vacio", async () => {
  const cmd: InitSignupCommand = {
    tenantId: "tenant_ok",
    callbackUrl: "https://example.com/cb",
    appId: "",
    state: "csrf_err",
  };
  const handler = new InitSignupHandler();
  const result = await handler.ejecutar(cmd);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.kind).toBe("app_id_invalido");
});

test("ejecutar retorna el state exacto que se le pasa", async () => {
  const cmd: InitSignupCommand = {
    tenantId: "t1",
    callbackUrl: "https://a.com/cb",
    appId: "111",
    state: "mi_csrf_token",
  };
  const handler = new InitSignupHandler();
  const result = await handler.ejecutar(cmd);
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value.state).toBe("mi_csrf_token");
  }
});