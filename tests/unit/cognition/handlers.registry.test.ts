import { expect, test } from "vitest";
import { TOOL_HANDLERS } from "../../../src/cognition/application/handlers.registry.ts";
import { CORE_TOOL_SPECS } from "../../../src/cognition/domain/tool.registry.core.ts";
import { handlerCommerceQuoteCreate } from "../../../src/cognition/application/handlers/tool.commerce.quote-create.ts";

test("A-13 REGISTRY-SIZE: exactamente 10 claves", () => {
  expect(Object.keys(TOOL_HANDLERS).length).toBe(10);
});

test("A-14 REGISTRY-SYNC: cada spec.nombre tiene clave en TOOL_HANDLERS", () => {
  for (const spec of CORE_TOOL_SPECS) {
    expect(spec.nombre in TOOL_HANDLERS).toBe(true);
  }
});

test("EXACTAMENTE 9 handlers son null (R11: los 9 pendientes)", () => {
  const nullCount = Object.values(TOOL_HANDLERS).filter((h) => h === null).length;
  expect(nullCount).toBe(9);
});

test("commerce.quote.create es el único handler implementado (no null)", () => {
  const implemented = Object.entries(TOOL_HANDLERS).filter(([, h]) => h !== null).map(([name]) => name);
  expect(implemented).toEqual(["commerce.quote.create"]);
});

test("A-15 NO-MOCK-EN-PROD: handler reference es función pura (validación + retorno estructurado)", async () => {
  const r = await handlerCommerceQuoteCreate({ tenantId: "t", items: [{ sku: "S", qty: 1, precio_cents: 100 }] });
  expect(r.ok).toBe(true);
  if (r.ok) {
    const v = r.value as { id: string; total_cents: number; creado_at: string };
    expect(typeof v.id).toBe("string");
    expect(v.total_cents).toBe(100);
    expect(typeof v.creado_at).toBe("string");
  }
});

test("TOOL_HANDLERS es Object.frozen", () => {
  expect(Object.isFrozen(TOOL_HANDLERS)).toBe(true);
});