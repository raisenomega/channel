import { expect, test, vi, beforeEach, afterEach } from "vitest";
import { signState, verifyState, nuevoNonce } from "../../../src/identity/infrastructure/oauth-state.ts";

const SECRET = "oauth_state_secret_fortress_test_32x";
beforeEach(() => vi.stubEnv("OAUTH_STATE_SECRET", SECRET));
afterEach(() => vi.unstubAllEnvs());

const freshConsume = () => { const used = new Set<string>(); return async (n: string) => (used.has(n) ? false : (used.add(n), true)); };
const payload = (over: Record<string, unknown> = {}) => ({ tenantId: "t-A", platform: "whatsapp", nonce: nuevoNonce(), ts: Date.now(), ...over });

test("A-N-9 valido: sign -> verify ok, payload intacto", async () => {
  const s = await signState(payload({ tenantId: "t-A" }));
  expect(s.ok).toBe(true);
  if (!s.ok) return;
  const v = await verifyState(s.value, freshConsume());
  expect(v.ok).toBe(true);
  if (v.ok) expect(v.value.tenantId).toBe("t-A");
});

test("A-N-9 firma alterada -> state_signature_invalid", async () => {
  const s = await signState(payload());
  if (!s.ok) throw new Error("sign fallo");
  const tampered = s.value.slice(0, -2) + (s.value.endsWith("aa") ? "bb" : "aa");
  const v = await verifyState(tampered, freshConsume());
  expect(v.ok).toBe(false);
  if (!v.ok) expect(v.error.kind).toBe("state_signature_invalid");
});

test("A-N-9 replay: mismo nonce 2x -> state_nonce_replayed", async () => {
  const s = await signState(payload());
  if (!s.ok) throw new Error("sign fallo");
  const consume = freshConsume();
  expect((await verifyState(s.value, consume)).ok).toBe(true);
  const v2 = await verifyState(s.value, consume);
  expect(v2.ok).toBe(false);
  if (!v2.ok) expect(v2.error.kind).toBe("state_nonce_replayed");
});

test("A-N-9 expirado: ts > 5 min -> state_expired", async () => {
  const s = await signState(payload({ ts: Date.now() - 6 * 60 * 1000 }));
  if (!s.ok) throw new Error("sign fallo");
  const v = await verifyState(s.value, freshConsume());
  expect(v.ok).toBe(false);
  if (!v.ok) expect(v.error.kind).toBe("state_expired");
});

test("A-N-9 secreto ausente/corto -> state_secret_missing (fail-safe)", async () => {
  vi.stubEnv("OAUTH_STATE_SECRET", "corto");
  const s = await signState(payload());
  expect(s.ok).toBe(false);
  if (!s.ok) expect(s.error.kind).toBe("state_secret_missing");
});
