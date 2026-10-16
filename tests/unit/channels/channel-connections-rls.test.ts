import { expect, test, vi } from "vitest";
import { readFileSync } from "node:fs";

/**
 * Hotfix I — A-13: RLS cross-tenant en channel_connections.
 * 1) El repositorio filtra SIEMPRE por el tenant autenticado (URL tenant_id=eq.<claim>).
 * 2) La migración 036 usa la precedence CORRECTA (auth.jwt() ->> 'tenant_id')::uuid,
 *    no el bug (auth.jwt() ->> 'tenant_id'::text::uuid) que rompía CREATE POLICY.
 */

const ORIGINAL_FETCH = globalThis.fetch;

test("A-13a RLS: listar para tenant A nunca devuelve filas de tenant B (filtro en URL)", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  // La DB devuelve filas mezcladas (como si RLS no filtrara); el repo DEBE filtrar por claim.
  const spy = vi.fn().mockResolvedValue(new Response(JSON.stringify([
    { id: "a1", tenant_id: "tenant-A", platform: "whatsapp", status: "connected" },
    { id: "b1", tenant_id: "tenant-B", platform: "instagram", status: "connected" },
  ]), { status: 200, headers: { "content-type": "application/json" } }));
  globalThis.fetch = spy;
  const { ChannelConnectionsRepo } = await import("../../../src/channels/infrastructure/channel-connections.repository.ts");
  const repo = new ChannelConnectionsRepo();
  // JWT del claim tenant-A
  const r = await repo.listar("tenant-A" as never);
  const url = spy.mock.calls[0]?.[0] as string;
  // URL contiene tenant_id=eq.tenant-A (filtro server-side; RLS es segunda defensa)
  expect(url).toContain("tenant_id=eq.tenant-A");
  expect(url).not.toContain("tenant-B");
  globalThis.fetch = ORIGINAL_FETCH; vi.unstubAllEnvs();
});

test("A-13b RLS precedence: 036 usa (auth.jwt() ->> 'tenant_id')::uuid, no ::text::uuid", () => {
  const sql = readFileSync("supabase/migrations/036_channel_connections.sql", "utf8");
  expect(sql).toContain("tenant_id = (auth.jwt() ->> 'tenant_id')::uuid");
  expect(sql).not.toContain("'tenant_id'::text::uuid");
  // DROP POLICY IF EXISTS para re-aplicación idempotente
  expect(sql).toContain("DROP POLICY IF EXISTS channel_connections_tenant_isolation");
});

test("A-13c RLS precedence: 040 usa la precedence correcta, no ::text::uuid", () => {
  const sql = readFileSync("supabase/migrations/040_activity_log.sql", "utf8");
  expect(sql).toContain("tenant_id = (auth.jwt() ->> 'tenant_id')::uuid");
  expect(sql).not.toContain("'tenant_id'::text::uuid");
  expect(sql).toContain("DROP POLICY IF EXISTS activity_log_tenant_isolation");
});