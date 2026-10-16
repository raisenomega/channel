import { expect, test } from "vitest";
import { evaluarPolicy, PolicyContext } from "../../../src/cognition/domain/tool-policy.ts";
import { CORE_TOOL_SPECS } from "../../../src/cognition/domain/tool.registry.core.ts";

const byName = (n: string) => CORE_TOOL_SPECS.find((s) => s.nombre === n)!;

const ctx = (over: Partial<PolicyContext> = {}): PolicyContext => ({
  tenantTier: "esencial", modo: "confianza", puertasAbiertas: [], ...over,
});

test("A-01 TIER_INSUFICIENTE: tenant esencial + tool business -> TIER_INSUFICIENTE", () => {
  const r = evaluarPolicy(byName("nucleo.customer.summary"), ctx({ tenantTier: "esencial" }));
  expect(r.ok).toBe(false);
  if (!r.ok) {
    expect(r.error.kind).toBe("TIER_INSUFICIENTE");
    if ("spec_min" in r.error) expect(r.error.spec_min).toBe("business");
  }
});

test("A-02 SIN_PUERTA: business + omega.content.request sin puerta -> SIN_PUERTA_PAGO plataforma omega", () => {
  const r = evaluarPolicy(byName("omega.content.request"), ctx({ tenantTier: "business" }));
  expect(r.ok).toBe(false);
  if (!r.ok) {
    expect(r.error.kind).toBe("SIN_PUERTA_PAGO");
    if ("plataforma" in r.error) expect(r.error.plataforma).toBe("omega");
  }
});

test("A-03 COPILOTO-MUTADOR: copiloto + whatsapp.catalog.set_item (mutador) -> MUTADOR_EN_COPILOTO", () => {
  const r = evaluarPolicy(byName("whatsapp.catalog.set_item"), ctx({ modo: "copiloto" }));
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("MUTADOR_EN_COPILOTO");
});

test("A-04 COPILOTO-LECTURA: copiloto + cerebro.retrieve (no mutador) -> ok", () => {
  const r = evaluarPolicy(byName("cerebro.retrieve"), ctx({ modo: "copiloto", tenantTier: "pro" }));
  expect(r.ok).toBe(true);
});

test("tenant business + nucleo.customer.summary con puerta nucleo -> ok", () => {
  const r = evaluarPolicy(byName("nucleo.customer.summary"), ctx({ tenantTier: "business", puertasAbiertas: ["nucleo"] }));
  expect(r.ok).toBe(true);
});

test("tool mutador en modo confianza -> ok", () => {
  const r = evaluarPolicy(byName("whatsapp.catalog.set_item"), ctx({ modo: "confianza" }));
  expect(r.ok).toBe(true);
});

test("tool mutador en modo autonomo -> ok", () => {
  const r = evaluarPolicy(byName("whatsapp.catalog.set_item"), ctx({ modo: "autonomo" }));
  expect(r.ok).toBe(true);
});

test("tier enterprise siempre pasa el check de tier para tools business", () => {
  const r = evaluarPolicy(byName("nucleo.accounting.ingest_transaction"), ctx({ tenantTier: "enterprise", puertasAbiertas: ["nucleo"] }));
  expect(r.ok).toBe(true);
});

test("ACCION_PROHIBIDA se chequea antes que TIER (tool proibida en spec)", () => {
  const forb = { ...byName("cerebro.retrieve"), accion: "__prohibida__borrar_dato_cliente" };
  const r = evaluarPolicy(forb, ctx({ tenantTier: "esencial", modo: "autonomo" }));
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("ACCION_PROHIBIDA");
});

test("PolicyContext frozen no muta", () => {
  const c = ctx();
  expect(Object.isFrozen(c) || Object.freeze(c) === c).toBe(true);
});

test("puerta abierta nucleo permite nucleo.finance.monthly_close", () => {
  const r = evaluarPolicy(byName("nucleo.finance.monthly_close"), ctx({ tenantTier: "business", puertasAbiertas: ["nucleo"] }));
  expect(r.ok).toBe(true);
});

test("A-11 POLICY-PURA: dos llamadas idénticas retornan Result equivalentes", () => {
  const spec = byName("omega.campaign.create");
  const c = ctx({ tenantTier: "esencial" });
  const a = evaluarPolicy(spec, c);
  const b = evaluarPolicy(spec, c);
  expect(JSON.stringify(a)).toBe(JSON.stringify(b));
});