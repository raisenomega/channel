/**
 * HUB by Raisen — M-6 (A-M-6): resolverTenantId con fallback (Opcion ii, D-37-bis).
 * Puro e inyectable: no requiere DB ni Deno. Cubre los 3 casos firmados:
 *   (1) claim presente -> usa claim, NO llama fallback.
 *   (2) claim ausente + fallback DB ok -> usa el tenant del fallback.
 *   (3) claim ausente + fallback null -> null (el caller devuelve claims_faltantes).
 */
import { expect, test, vi } from "vitest";
import type { JWTPayload } from "jose";
import { resolverTenantId } from "../../../src/server/tenant-resolver.ts";

const nunca = vi.fn(async () => { throw new Error("fallback no debia llamarse"); });

test("A-M-6 (1) claim presente -> usa el claim y NO llama al fallback", async () => {
  const payload = { sub: "u1", app_metadata: { tenant_id: "t-claim" } } as unknown as JWTPayload;
  const r = await resolverTenantId(payload, nunca);
  expect(r).toBe("t-claim");
  expect(nunca).not.toHaveBeenCalled();
});

test("A-M-6 (2) claim ausente + fallback DB ok -> usa el tenant del fallback", async () => {
  const payload = { sub: "u2", app_metadata: {} } as unknown as JWTPayload;
  const fb = vi.fn(async (sub: string) => (sub === "u2" ? "t-db" : null));
  const r = await resolverTenantId(payload, fb);
  expect(r).toBe("t-db");
  expect(fb).toHaveBeenCalledWith("u2");
});

test("A-M-6 (3) claim ausente + fallback null -> null", async () => {
  const payload = { sub: "u3", app_metadata: {} } as unknown as JWTPayload;
  const r = await resolverTenantId(payload, async () => null);
  expect(r).toBeNull();
});

test("A-M-6 (4) sin sub -> null (no intenta fallback)", async () => {
  const payload = { app_metadata: {} } as unknown as JWTPayload;
  const r = await resolverTenantId(payload, nunca);
  expect(r).toBeNull();
  expect(nunca).not.toHaveBeenCalled();
});
