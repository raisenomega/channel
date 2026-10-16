import { expect, test } from "vitest";
import { ToolRouter } from "../../../src/cognition/application/tool-router.ts";
import { ok, err } from "../../../src/shared/domain/result.ts";
import type { ModelTier } from "../../../src/cognition/domain/routing-table.ts";

type ResolverLike = { resolverModelo: (t: ModelTier) => Promise<ResultLike> };
type ResultLike = { ok: boolean; value?: string; error?: { kind: string } };

function stub(behavior: (t: ModelTier) => ResultLike): ResolverLike {
  return { resolverModelo: async (t) => {
    const r = behavior(t);
    return r.ok ? ok(r.value!) : err(r.error!);
  } };
}

const okTier = (t: ModelTier): ResultLike => ({ ok: true, value: `claude-${t}-4-5` });
const failTier = (): ResultLike => ({ ok: false, error: { kind: "provider_unavailable" } });

test("A-07 DEGRADACION: victor (opus) con fallo opus -> cae a sonnet, degradado=true", async () => {
  const s = stub((t) => (t === "opus" ? failTier() : okTier(t)));
  const router = new ToolRouter(s as never);
  const r = await router.resolverRuta("victor");
  expect(r.ok).toBe(true);
  if (r.ok) {
    expect(r.value.tier_declarado).toBe("opus");
    expect(r.value.tier_usado).toBe("sonnet");
    expect(r.value.degradado).toBe(true);
    expect(r.value.modelo_concreto).toBe("claude-sonnet-4-5");
  }
});

test("A-08 PERSONA-FANTASMA: pedrito -> PERSONA_DESCONOCIDA", async () => {
  const router = new ToolRouter(stub(okTier) as never);
  const r = await router.resolverRuta("pedrito");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("PERSONA_DESCONOCIDA");
});

test("A-09 SAFETY-NET: resolver falla en todos tiers -> claude-haiku-4-5 sin crash", async () => {
  const s = stub(() => failTier());
  const router = new ToolRouter(s as never);
  const r = await router.resolverRuta("victor");
  expect(r.ok).toBe(true);
  if (r.ok) {
    expect(r.value.degradado).toBe(true);
    expect(r.value.tier_usado).toBe("haiku");
    expect(r.value.modelo_concreto).toBe("claude-haiku-4-5");
  }
});

test("victor tier opus -> resolver llamado con opus y ok, degradado=false", async () => {
  const calls: ModelTier[] = [];
  const s = stub((t) => { calls.push(t); return okTier(t); });
  const router = new ToolRouter(s as never);
  const r = await router.resolverRuta("victor");
  expect(r.ok).toBe(true);
  if (r.ok) { expect(r.value.tier_usado).toBe("opus"); expect(r.value.degradado).toBe(false); }
  expect(calls[0]).toBe("opus");
});

test("A-10 INMUTABILIDAD: ResolvedRoute es frozen", async () => {
  const router = new ToolRouter(stub(okTier) as never);
  const r = await router.resolverRuta("kelsy");
  expect(r.ok).toBe(true);
  if (r.ok) expect(Object.isFrozen(r.value)).toBe(true);
});

test("zahra (sonnet) con fallo sonnet -> cae a haiku", async () => {
  const s = stub((t) => (t === "sonnet" ? failTier() : okTier(t)));
  const router = new ToolRouter(s as never);
  const r = await router.resolverRuta("zahra");
  expect(r.ok).toBe(true);
  if (r.ok) {
    expect(r.value.tier_declarado).toBe("sonnet");
    expect(r.value.tier_usado).toBe("haiku");
    expect(r.value.modelo_concreto).toBe("claude-haiku-4-5");
  }
});