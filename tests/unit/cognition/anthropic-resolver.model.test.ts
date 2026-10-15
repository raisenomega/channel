import { expect, test, vi } from "vitest";
import { AnthropicModelResolver } from "../../../src/cognition/infrastructure/anthropic-model-resolver.ts";

test("I2: resolverModelo elige el sonnet mas reciente de /v1/models", async () => {
  const models = { data: [
    { id: "claude-sonnet-4-5", created_at: "2025-04-01T00:00:00Z" },
    { id: "claude-sonnet-5-8", created_at: "2026-09-01T00:00:00Z" },
    { id: "claude-sonnet-4-5-old", created_at: "2025-03-01T00:00:00Z" },
  ] };
  const resp = new Response(JSON.stringify(models), { status: 200, headers: { "content-type": "application/json" } });
  const fetchSpy = vi.fn().mockResolvedValue(resp);
  const origFetch = globalThis.fetch;
  globalThis.fetch = fetchSpy;
  try {
    const resolver = new AnthropicModelResolver("test-key");
    const result = await resolver.resolverModelo("sonnet");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe("claude-sonnet-5-8");
  } finally { globalThis.fetch = origFetch; }
});

test("I2: resolverModelo cae al safety net si /v1/models falla", async () => {
  const fetchSpy = vi.fn().mockRejectedValue(new Error("network down"));
  const origFetch = globalThis.fetch;
  globalThis.fetch = fetchSpy;
  try {
    const resolver = new AnthropicModelResolver("test-key");
    const result = await resolver.resolverModelo("sonnet");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toMatch(/claude-sonnet/);
  } finally { globalThis.fetch = origFetch; }
});

test("I2: resolverModelo ignora modelos deprecados", async () => {
  const models = { data: [
    { id: "claude-sonnet-4-5-legacy", created_at: "2025-01-01T00:00:00Z" },
    { id: "claude-sonnet-4-5", created_at: "2025-05-01T00:00:00Z" },
  ] };
  const resp = new Response(JSON.stringify(models), { status: 200, headers: { "content-type": "application/json" } });
  const fetchSpy = vi.fn().mockResolvedValue(resp);
  const origFetch = globalThis.fetch;
  globalThis.fetch = fetchSpy;
  try {
    const resolver = new AnthropicModelResolver("test-key");
    const result = await resolver.resolverModelo("sonnet");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe("claude-sonnet-4-5");
  } finally { globalThis.fetch = origFetch; }
});