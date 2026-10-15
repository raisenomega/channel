import { expect, test, vi } from "vitest";
import { SignJWT } from "jose";
import { parsearJwtClaims } from "../../../src/server/jwt-verify.ts";

const SECRET = "test-supabase-jwt-secret-which-is-long-enough-32char";
const OTHER_SECRET = "a-different-secret-long-enough-32char-minimum";

async function sign(payload: Record<string, unknown>, secret: string, opts?: { exp?: number; alg?: string }): Promise<string> {
  const exp = opts?.exp ?? "1h";
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: opts?.alg ?? "HS256" })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(new TextEncoder().encode(secret));
}

function parse(auth: string | null) { return parsearJwtClaims(auth); }

test("authHeader null -> token_ausente", async () => {
  const r = await parse(null);
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("token_ausente");
});

test("authHeader 'Bearer ' vacio -> token_ausente", async () => {
  vi.stubEnv("SUPABASE_JWT_SECRET", SECRET);
  const r = await parse("Bearer ");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("token_ausente");
  vi.unstubAllEnvs();
});

test("authHeader 'Basic xxx' -> token_ausente", async () => {
  const r = await parse("Basic dXNlcjpwYXNz");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("token_ausente");
});

test("SUPABASE_JWT_SECRET ausente -> config_incompleta", async () => {
  const r = await parse("Bearer xxx.yyy.zzz");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("config_incompleta");
});

test("JWT con exp en el pasado -> token_expirado", async () => {
  vi.stubEnv("SUPABASE_JWT_SECRET", SECRET);
  const past = Math.floor(Date.now() / 1000) - 3600;
  const t = await sign({ sub: "u1", tenant_id: "t1" }, SECRET, { exp: past });
  const r = await parse(`Bearer ${t}`);
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("token_expirado");
  vi.unstubAllEnvs();
});

test("JWT firmado con secret distinto -> firma_invalida", async () => {
  vi.stubEnv("SUPABASE_JWT_SECRET", SECRET);
  const t = await sign({ sub: "u1", tenant_id: "t1" }, OTHER_SECRET);
  const r = await parse(`Bearer ${t}`);
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("firma_invalida");
  vi.unstubAllEnvs();
});

test("JWT sin sub -> claims_faltantes sub", async () => {
  vi.stubEnv("SUPABASE_JWT_SECRET", SECRET);
  const t = await sign({ tenant_id: "t1" }, SECRET);
  const r = await parse(`Bearer ${t}`);
  expect(r.ok).toBe(false);
  if (!r.ok) { expect(r.error.kind).toBe("claims_faltantes"); if (r.error.kind === "claims_faltantes") expect(r.error.campo).toBe("sub"); }
  vi.unstubAllEnvs();
});

test("JWT sin tenant_id -> claims_faltantes tenant_id", async () => {
  vi.stubEnv("SUPABASE_JWT_SECRET", SECRET);
  const t = await sign({ sub: "u1" }, SECRET);
  const r = await parse(`Bearer ${t}`);
  expect(r.ok).toBe(false);
  if (!r.ok) { expect(r.error.kind).toBe("claims_faltantes"); if (r.error.kind === "claims_faltantes") expect(r.error.campo).toBe("tenant_id"); }
  vi.unstubAllEnvs();
});

test("JWT valido con claims -> ok userId/tenantId/exp", async () => {
  vi.stubEnv("SUPABASE_JWT_SECRET", SECRET);
  const t = await sign({ sub: "user-42", tenant_id: "tenant-9", email: "a@b.c" }, SECRET);
  const r = await parse(`Bearer ${t}`);
  expect(r.ok).toBe(true);
  if (r.ok) {
    expect(r.value.userId).toBe("user-42");
    expect(r.value.tenantId).toBe("tenant-9");
    expect(r.value.email).toBe("a@b.c");
    expect(r.value.exp).toBeGreaterThan(0);
  }
  vi.unstubAllEnvs();
});

test("alg:none -> firma_invalida (jose lo rechaza)", async () => {
  vi.stubEnv("SUPABASE_JWT_SECRET", SECRET);
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: "u1", tenant_id: "t1" })).toString("base64url");
  const t = `${header}.${payload}.`;
  const r = await parse(`Bearer ${t}`);
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("firma_invalida");
  vi.unstubAllEnvs();
});

test("alg:RS256 cuando esperamos HS256 -> firma_invalida (alg confusion)", async () => {
  vi.stubEnv("SUPABASE_JWT_SECRET", SECRET);
  // Token que declara RS256 (attack) — jose con algorithms:["HS256"] debe rechazarlo
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: "u1", tenant_id: "t1", exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url");
  const sig = Buffer.from("fake-signature-for-rs256").toString("base64url");
  const t = `${header}.${payload}.${sig}`;
  const r = await parse(`Bearer ${t}`);
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("firma_invalida");
  vi.unstubAllEnvs();
});