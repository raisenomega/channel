/**
 * HUB by Raisen — Integration tests for Embedded Signup Meta (Slice 1).
 * Flujo: init signup → callback webhook (CREATED → ATTEMPTED_REACH → COMPLETED).
 * NOTA: Usa almacenes en memoria. Meta real (graph.facebook.com) no se contacta.
 */
import { expect, test } from "vitest";
import { InitSignupHandler, InitSignupCommand } from "../../../../src/channels/meta/application/init-signup.handler.ts";
import { HandleCallbackHandler, EmbeddedSignupRepository } from "../../../../src/channels/meta/application/handle-callback.handler.ts";
import { EmbeddedSignupStatus } from "../../../../src/channels/meta/domain/embedded-signup.entity.ts";
import { ok } from "../../../../src/shared/domain/result.ts";
import type { Result } from "../../../../src/shared/domain/result.ts";

// ─── In-memory store for EmbeddedSignupRepository ──────────────────────

interface SignupRecord {
  id: string;
  tenantId: string;
  status: EmbeddedSignupStatus;
}

class MemoryEmbeddedSignupStore implements EmbeddedSignupRepository {
  private items: SignupRecord[] = [];

  async buscarPorMetaId(metaId: string): Promise<Result<{ id: string; tenantId: string; status: EmbeddedSignupStatus } | null, string>> {
    const item = this.items.find((s) => s.id === metaId);
    if (!item) return ok(null);
    return ok({ ...item });
  }

  async actualizar(signupId: string, data: Record<string, unknown>): Promise<Result<void, string>> {
    const idx = this.items.findIndex((s) => s.id === signupId);
    if (idx >= 0) {
      const status = data["status"] as EmbeddedSignupStatus | undefined;
      if (status) this.items[idx].status = status;
    }
    return ok(undefined);
  }

  async guardarToken(_a: string, _b: string, _c: string, _d: string, _e: string, _f: string): Promise<Result<void, string>> {
    return ok(undefined);
  }

  limpiar(): void {
    this.items = [];
  }

  sembrar(id: string, tenantId: string, status: EmbeddedSignupStatus): void {
    this.items.push({ id, tenantId, status });
  }
}

// ─── Tests ────────────────────────────────────────────────────────────

test("Embedded Signup: flujo completo CREATED -> ATTEMPTED_REACH -> COMPLETED", async () => {
  const store = new MemoryEmbeddedSignupStore();
  const initHandler = new InitSignupHandler();
  const callbackHandler = new HandleCallbackHandler(store);

  // 1) Init: generar URL OAuth
  const cmd: InitSignupCommand = {
    tenantId: "tenant_integration",
    callbackUrl: "https://channel-blue.vercel.app/api/meta/callback",
    appId: "123456789012345",
    state: "csrf_integration_test",
  };
  const initResult = await initHandler.ejecutar(cmd);
  expect(initResult.ok, "Init debe generar URL").toBe(true);
  if (!initResult.ok) return;

  // La URL debe contener los parametros OAuth
  const url = new URL(initResult.value.url);
  expect(url.searchParams.get("app_id")).toBe("123456789012345");
  expect(url.searchParams.get("state")).toBe("csrf_integration_test");
  expect(url.searchParams.get("response_type")).toBe("code");

  // 2) Primer callback: CREATED (webhook inicial)
  const step1 = await callbackHandler.ejecutar({
    id: "meta_waba_001",
    status: "CREATED",
  });
  expect(step1.ok, "CREATED debe ser aceptado").toBe(true);
  if (!step1.ok) return;
  expect(step1.value.status).toBe("CREATED");
  const signupId = step1.value.signupId;

  // 3) Sembrar el signup en el store (el handler lo persiste si existe)
  store.sembrar(signupId, "tenant_integration", "CREATED");

  // 4) Segundo callback: ATTEMPTED_REACH
  const step2 = await callbackHandler.ejecutar({
    id: signupId,
    status: "ATTEMPTED_REACH",
    waba_id: "waba_001",
    phone_number_id: "phone_001",
  });
  expect(step2.ok, "ATTEMPTED_REACH debe ser aceptado").toBe(true);
  if (!step2.ok) return;
  expect(step2.value.status).toBe("ATTEMPTED_REACH");

  // 5) Actualizar store
  store.sembrar(signupId, "tenant_integration", "ATTEMPTED_REACH");

  // 6) Tercer callback: COMPLETED con token
  const step3 = await callbackHandler.ejecutar({
    id: signupId,
    status: "COMPLETED",
    waba_id: "waba_001",
    phone_number_id: "phone_001",
    access_token: "EAA_success_integration",
    access_token_expires_at: "2026-01-01T00:00:00Z",
  });
  expect(step3.ok, "COMPLETED con token debe ser aceptado").toBe(true);
  if (!step3.ok) return;
  expect(step3.value.status).toBe("COMPLETED");
  expect(step3.value.wabaId).toBe("waba_001");
  expect(step3.value.phoneNumberId).toBe("phone_001");
});

test("Embedded Signup: COMPLETED sin token es rechazado", async () => {
  const store = new MemoryEmbeddedSignupStore();
  const callbackHandler = new HandleCallbackHandler(store);

  // Sembrar un signup en ATTEMPTED_REACH
  store.sembrar("sig_no_token", "tenant_reject", "ATTEMPTED_REACH");

  const result = await callbackHandler.ejecutar({
    id: "sig_no_token",
    status: "COMPLETED",
    waba_id: "w_1",
    phone_number_id: "p_1",
    // Sin access_token
  });

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error.kind).toBe("validacion_fallo");
    expect(result.error.cause).toBe("token_incompleto");
  }
});

test("Embedded Signup: transicion invalida COMPLETED -> DELETED rechazada", async () => {
  const store = new MemoryEmbeddedSignupStore();
  const callbackHandler = new HandleCallbackHandler(store);

  store.sembrar("sig_del", "tenant_del", "COMPLETED");

  const result = await callbackHandler.ejecutar({
    id: "sig_del",
    status: "DELETED",
  });

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error.kind).toBe("validacion_fallo");
    expect(result.error.cause).toContain("transicion_invalida");
  }
});

test("Embedded Signup: payload con status desconocido rechazado", async () => {
  const store = new MemoryEmbeddedSignupStore();
  const callbackHandler = new HandleCallbackHandler(store);

  const result = await callbackHandler.ejecutar({
    id: "sig_bad_status",
    status: "BOGUS_STATUS",
  });

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error.kind).toBe("validacion_fallo");
    expect(result.error.cause).toBe("status_invalido");
  }
});