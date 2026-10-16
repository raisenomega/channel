import { expect, test } from "vitest";
import { ToolExecutor } from "../../../src/cognition/application/tool-executor.ts";
import { PolicyContext } from "../../../src/cognition/domain/tool-policy.ts";
import { ok, err } from "../../../src/shared/domain/result.ts";

const ctx = (over: Partial<PolicyContext> = {}): PolicyContext => ({
  tenantTier: "esencial", modo: "confianza", puertasAbiertas: [], ...over,
});

const executor = new ToolExecutor();

const validQuoteParams = { tenantId: "tenant-A", items: [{ sku: "S1", qty: 2, precio_cents: 500 }] };

test("A-05 TOOL-FANTASMA: foo.bar -> TOOL_DESCONOCIDO", async () => {
  const r = await executor.ejecutar("foo.bar", {}, ctx());
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("TOOL_DESCONOCIDO");
});

test("A-06 HANDLER-NULL: omega.brand_voice.get (handler null) -> HANDLER_NO_IMPLEMENTADO", async () => {
  const r = await executor.ejecutar("omega.brand_voice.get", {}, ctx({ tenantTier: "business", puertasAbiertas: ["omega"] }));
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("HANDLER_NO_IMPLEMENTADO");
});

test("commerce.quote.create con params válidos -> ok(QuoteDraft)", async () => {
  const r = await executor.ejecutar("commerce.quote.create", validQuoteParams, ctx());
  expect(r.ok).toBe(true);
  if (r.ok) {
    const v = r.value as { total_cents: number; items: Array<{ sku: string }> };
    expect(v.total_cents).toBe(1000);
    expect(v.items[0].sku).toBe("S1");
  }
});

test("commerce.quote.create sin tenantId -> HANDLER_ERROR causa tenantId_requerido", async () => {
  const r = await executor.ejecutar("commerce.quote.create", { items: validQuoteParams.items }, ctx());
  expect(r.ok).toBe(false);
  if (!r.ok) {
    expect(r.error.kind).toBe("HANDLER_ERROR");
    if ("causa" in r.error) expect(r.error.causa).toBe("tenantId_requerido");
  }
});

test("policy rechaza antes de llegar al handler", async () => {
  // whatsapp.catalog.set_item es mutador + modo copiloto -> MUTADOR_EN_COPILOTO antes de handler
  const r = await executor.ejecutar("whatsapp.catalog.set_item", {}, ctx({ modo: "copiloto" }));
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("POLICY_RECHAZO");
});

test("A-12 RESULT-NO-THROW: handler que accidentalmente throw -> capturado como HANDLER_ERROR", async () => {
  // montamos un executor con un handler que tira error vía registry nativo no posible;
  // usamos tool commerce.quote.create con params que fuerzan throw del item inválido -> retorna HANDLER_ERROR (no throw)
  const r = await executor.ejecutar("commerce.quote.create", { tenantId: "t", items: [{ sku: 123, qty: "x", precio_cents: 0 }] }, ctx());
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("HANDLER_ERROR");
});

test("resultado del handler se propaga como-es", async () => {
  const r = await executor.ejecutar("commerce.quote.create", validQuoteParams, ctx());
  expect(r.ok).toBe(true);
});

test("handler null no se ejecuta (nucleo.customer.summary con puerta nucleo)", async () => {
  const r = await executor.ejecutar("nucleo.customer.summary", {}, ctx({ tenantTier: "business", puertasAbiertas: ["nucleo"] }));
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("HANDLER_NO_IMPLEMENTADO");
});