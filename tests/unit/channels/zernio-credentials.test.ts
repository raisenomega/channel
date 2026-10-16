import { expect, test, vi } from "vitest";
import { ZernioCredentialsRepository } from "../../../src/channels/infrastructure/zernio.credentials.ts";

const ORIGINAL_FETCH = globalThis.fetch;
function restoreFetch(): void { globalThis.fetch = ORIGINAL_FETCH; }

test("A-07 CREDENCIAL_AUSENTE: Vault sin ZERNIO_API_KEY -> CREDENCIAL_AUSENTE", async () => {
  globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 404 }));
  process.env["SUPABASE_URL"] = "https://s.co";
  process.env["SUPABASE_SERVICE_ROLE_KEY"] = "k";
  const repo = new ZernioCredentialsRepository();
  const r = await repo.leer();
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("CREDENCIAL_AUSENTE");
  restoreFetch();
});

test("ambas credenciales ok -> ok freeze", async () => {
  const calls: Response[] = [
    new Response(JSON.stringify("key_zernio_123"), { status: 200, headers: { "content-type": "application/json" } }),
    new Response(JSON.stringify("whsec_xyz"), { status: 200, headers: { "content-type": "application/json" } }),
  ];
  globalThis.fetch = vi.fn().mockImplementation(async () => calls.shift());
  process.env["SUPABASE_URL"] = "https://s.co";
  process.env["SUPABASE_SERVICE_ROLE_KEY"] = "k";
  const repo = new ZernioCredentialsRepository();
  const r = await repo.leer();
  expect(r.ok).toBe(true);
  if (r.ok) {
    expect(r.value.apiKey).toBe("key_zernio_123");
    expect(r.value.webhookSecret).toBe("whsec_xyz");
    expect(Object.isFrozen(r.value)).toBe(true);
  }
  restoreFetch();
});

test("config incompleta -> CREDENCIAL_AUSENTE config_incompleta", async () => {
  delete process.env["SUPABASE_URL"];
  delete process.env["SUPABASE_SERVICE_ROLE_KEY"];
  const repo = new ZernioCredentialsRepository();
  const r = await repo.leer();
  expect(r.ok).toBe(false);
});