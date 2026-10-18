/**
 * HUB by Raisen — Q (JWKS ES256) adversariales A-Q-1..A-Q-5 de jwt-jwks-verify.
 * ES256 real (generateKeyPair) + JWKS servido via fetch stub. Cada test usa una URL unica
 * (?c=) para que el cache por-URL del modulo no se contamine entre casos.
 */
import { expect, test, vi, afterEach } from "vitest";
import { SignJWT, generateKeyPair, exportJWK } from "jose";
import { verificarTokenJwt, getHs256FallbackCount } from "../../../src/identity/infrastructure/jwt-jwks-verify.ts";

const HS_SECRET = "legacy-hs256-secret-long-enough-32chars-xx";

async function es256(kid: string) {
  const { publicKey, privateKey } = await generateKeyPair("ES256", { extractable: true });
  const jwk = { ...(await exportJWK(publicKey)), kid, alg: "ES256", use: "sig" };
  return { jwk, privateKey };
}
async function signEs(privateKey: CryptoKey, kid: string): Promise<string> {
  return new SignJWT({ sub: "u1", tenant_id: "t1" })
    .setProtectedHeader({ alg: "ES256", kid }).setIssuedAt().setExpirationTime("1h").sign(privateKey);
}
function jwksResponse(keys: unknown[]): Response {
  return new Response(JSON.stringify({ keys }), { status: 200, headers: { "content-type": "application/json" } });
}

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.useRealTimers(); });

test("A-Q-1 ES256 valido con kid conocido -> pass", async () => {
  const { jwk, privateKey } = await es256("kid-1");
  vi.stubEnv("SUPABASE_JWKS_URL", "https://p.test/jwks?c=aq1");
  vi.stubGlobal("fetch", vi.fn(async () => jwksResponse([jwk])));
  const r = await verificarTokenJwt(await signEs(privateKey, "kid-1"));
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value.sub).toBe("u1");
});

test("A-Q-2 kid desconocido -> re-fetch JWKS pasado el cooldown -> pass", async () => {
  const { jwk, privateKey } = await es256("kid-rot");
  const token = await signEs(privateKey, "kid-rot");
  vi.stubEnv("SUPABASE_JWKS_URL", "https://p.test/jwks?c=aq2");
  // 1er fetch sin la llave (kid desconocido); 2do fetch (tras cooldown) ya con la llave.
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(jwksResponse([]))
    .mockResolvedValue(jwksResponse([jwk]));
  vi.stubGlobal("fetch", fetchMock);
  vi.useFakeTimers();
  const r1 = await verificarTokenJwt(token); // fetch#1 vacio -> kid no encontrado -> falla
  expect(r1.ok).toBe(false);
  vi.setSystemTime(Date.now() + 31_000); // supera cooldownDuration (30s)
  const r2 = await verificarTokenJwt(token); // refetch#2 trae la llave -> pass
  expect(r2.ok).toBe(true);
  expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2);
});

test("A-Q-3 token HS256 legacy -> pass via fallback + contador +1", async () => {
  vi.stubEnv("SUPABASE_JWT_SECRET", HS_SECRET);
  const before = getHs256FallbackCount();
  const token = await new SignJWT({ sub: "u1", tenant_id: "t1" })
    .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("1h")
    .sign(new TextEncoder().encode(HS_SECRET));
  const r = await verificarTokenJwt(token);
  expect(r.ok).toBe(true);
  expect(getHs256FallbackCount()).toBe(before + 1);
});

test("A-Q-4 alg=none -> firma_invalida (jamas aceptar)", async () => {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: "u1", tenant_id: "t1" })).toString("base64url");
  const r = await verificarTokenJwt(`${header}.${payload}.`);
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("firma_invalida");
});

test("A-Q-5 JWKS endpoint caido -> fail-closed (sin bypass)", async () => {
  const { privateKey } = await es256("kid-x");
  vi.stubEnv("SUPABASE_JWKS_URL", "https://p.test/jwks?c=aq5");
  vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("ECONNREFUSED"); }));
  const r = await verificarTokenJwt(await signEs(privateKey, "kid-x"));
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("firma_invalida");
});
