/**
 * HUB by Raisen — documento formal de la cotizacion publica: negocio/numero/cliente, items, escape, estados.
 */
import { expect, test } from "vitest";
import { renderQuoteDoc } from "../../../src/cognition/presentation/public-quote.renderer.ts";
import type { DatosCotizacion } from "../../../src/cognition/infrastructure/public-quote.biz.ts";

const base: DatosCotizacion = {
  quote: { items: [{ description: "Zafacon soterrado", quantity: 5, unitPrice: 100, lineTotal: 500 }], total: 500, conclusion: "5 unidades", decision: null, tenantId: "t", contactId: "c", createdAt: "2026-10-26T00:00:00Z" },
  biz: { name: "Zafacones Ramos", phone: "7871234567", email: "", address: "Bayamon", logoUrl: null, terms: "Valida 30 dias" },
  cliente: { nombre: "Jorge", telefono: "7871234567", direccion: "Bayamon PR", email: "jorge@mail.com" }, numero: "COT-ABC12345", fecha: "2026-10-26", token: "tok123",
};

test("PQ-01 documento formal: negocio, numero, cliente, items, total, botones", () => {
  const h = renderQuoteDoc(base);
  expect(h).toContain("Zafacones Ramos");
  expect(h).toContain("COT-ABC12345");
  expect(h).toContain("Jorge");
  expect(h).toContain("7871234567");
  expect(h).toContain("jorge@mail.com");
  expect(h).toContain("Bayamon PR");
  expect(h).toContain("Zafacon soterrado");
  expect(h).toContain("$500.00");
  expect(h).toContain('action="/q/tok123/accept"');
  expect(h).toContain('action="/q/tok123/reject"');
  expect(h).toContain("Valida 30 dias");
});

test("PQ-02 escapa XSS en la descripcion", () => {
  const h = renderQuoteDoc({ ...base, quote: { ...base.quote, items: [{ description: "<script>alert(1)</script>", quantity: 1, unitPrice: 1, lineTotal: 1 }] } });
  expect(h).not.toContain("<script>alert(1)</script>");
  expect(h).toContain("&lt;script&gt;");
});

test("PQ-03 decidida: muestra estado, sin botones", () => {
  const h = renderQuoteDoc({ ...base, quote: { ...base.quote, decision: "accepted" } });
  expect(h).toContain("Aceptaste");
  expect(h).not.toContain("/q/tok123/accept");
});
