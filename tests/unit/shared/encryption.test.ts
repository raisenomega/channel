import { expect, test, vi } from "vitest";
import { encriptarToken, desencriptarToken } from "../../../src/shared/infrastructure/encryption.ts";

const TEST_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

test("encriptarToken retorna nonce y ciphertext", () => {
  vi.stubEnv("META_TOKEN_ENCRYPTION_KEY", TEST_KEY);
  const result = encriptarToken("EAA_system_user_token_abc123");
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value.nonce).toBeDefined();
    expect(result.value.nonce).toHaveLength(48); // 24 bytes = 48 hex chars
    expect(result.value.ciphertext).toBeDefined();
    expect(result.value.ciphertext.length).toBeGreaterThan(0);
  }
  vi.unstubAllEnvs();
});

test("desencriptarToken recupera el token original", () => {
  vi.stubEnv("META_TOKEN_ENCRYPTION_KEY", TEST_KEY);
  const original = "EAA_token_secreto_que_no_debe_estar_en_claro";
  const encResult = encriptarToken(original);
  expect(encResult.ok).toBe(true);
  if (!encResult.ok) return;
  const decResult = desencriptarToken(encResult.value);
  expect(decResult.ok).toBe(true);
  if (decResult.ok) {
    expect(decResult.value).toBe(original);
  }
  vi.unstubAllEnvs();
});

test("encriptarToken: sin clave retorna clave_no_configurada", () => {
  // Sin META_TOKEN_ENCRYPTION_KEY
  const result = encriptarToken("token");
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.kind).toBe("clave_no_configurada");
});

test("encriptarToken: clave invalida (corta) retorna error", () => {
  vi.stubEnv("META_TOKEN_ENCRYPTION_KEY", "aabb");
  const result = encriptarToken("token");
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.kind).toBe("clave_invalida");
  vi.unstubAllEnvs();
});

test("desencriptarToken con datos corruptos retorna fallo_encriptacion", () => {
  vi.stubEnv("META_TOKEN_ENCRYPTION_KEY", TEST_KEY);
  const result = desencriptarToken({ nonce: "ab".repeat(24), ciphertext: "deadbeef" });
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.kind).toBe("fallo_encriptacion");
  vi.unstubAllEnvs();
});

test("encriptacion produce ciphertext distinto cada vez (nonce aleatorio)", () => {
  vi.stubEnv("META_TOKEN_ENCRYPTION_KEY", TEST_KEY);
  const r1 = encriptarToken("mismo_token");
  const r2 = encriptarToken("mismo_token");
  expect(r1.ok).toBe(true);
  expect(r2.ok).toBe(true);
  if (r1.ok && r2.ok) {
    expect(r1.value.ciphertext).not.toBe(r2.value.ciphertext);
  }
  vi.unstubAllEnvs();
});

test("el ciphertext NO contiene el token en claro", () => {
  vi.stubEnv("META_TOKEN_ENCRYPTION_KEY", TEST_KEY);
  const tokenClaro = "EAA_super_secreto_no_visible";
  const result = encriptarToken(tokenClaro);
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value.ciphertext).not.toContain("EAA");
    expect(result.value.ciphertext).not.toContain(tokenClaro);
  }
  vi.unstubAllEnvs();
});