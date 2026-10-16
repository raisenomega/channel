import { expect, test, vi } from "vitest";
import { AgentDraftsRepository } from "../../../src/cognition/infrastructure/agent-drafts.repository.ts";

const ORIGINAL_FETCH = globalThis.fetch;
function restoreFetch(): void { globalThis.fetch = ORIGINAL_FETCH; }
function cfg(): void { vi.stubEnv("SUPABASE_URL", "https://s.co"); vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "k"); }
function uncfg(): void { restoreFetch(); vi.unstubAllEnvs(); }

const draft = { id: "d1", tenantId: "t1" as never, conversationId: "c1" as never, contactId: "c1" as never, personaSlug: "victor", inboundMessage: "msg", draftContent: "resp", confidence: 0.5, reason: "x", status: "draft" as never, aiDisclosureIncluded: true, traceId: "t1", metadata: Object.freeze({}), createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" };

test("insertar ok -> draft persistido", async () => {
  cfg();
  globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(draft), { status: 200, headers: { "content-type": "application/json" } }));
  const repo = new AgentDraftsRepository();
  const r = await repo.insertar(draft);
  expect(r.ok).toBe(true);
  uncfg();
});

test("A-10 IDEMPOTENCIA_INBOUND_HASH: mismo hash rechazado (400)", async () => {
  cfg();
  globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 400 }));
  const repo = new AgentDraftsRepository();
  const r = await repo.insertar(draft);
  expect(r.ok).toBe(false);
  uncfg();
});

test("A-11 RLS_AISLAMIENTO: listarPendientes filtra tenant_id en URL", async () => {
  cfg();
  const spy = vi.fn().mockResolvedValue(new Response(JSON.stringify([]), { status: 200, headers: { "content-type": "application/json" } }));
  globalThis.fetch = spy;
  const repo = new AgentDraftsRepository();
  await repo.listarPendientes("tenant-B" as never);
  const url = spy.mock.calls[0]?.[0] as string;
  expect(url).toContain("tenant_id=eq.tenant-B");
  expect(url).toContain("status=eq.draft");
  uncfg();
});