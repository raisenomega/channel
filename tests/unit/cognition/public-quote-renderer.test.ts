/**
 * HUB by Raisen — pagina publica de cotizacion: escape anti-XSS + estados (sin decision / decidida).
 */
import { expect, test } from "vitest";
import { renderQuotePage } from "../../../src/cognition/presentation/public-quote.renderer.ts";
import type { PublicQuote } from "../../../src/cognition/infrastructure/public-quote.query.ts";

const base: PublicQuote = { items: [{ description: "Zafacon soterrado", quantity: 5, unitPrice: 100, lineTotal: 500 }], total: 500, conclusion: "5 unidades", decision: null, business: "Zafacones Ramos" };

test("PQ-01 muestra items + total + botones aceptar/rechazar", () => {
  const h = renderQuotePage("tok123", base);
  expect(h).toContain("Zafacon soterrado");
  expect(h).toContain("$500.00");
  expect(h).toContain('action="/q/tok123/accept"');
  expect(h).toContain('action="/q/tok123/reject"');
});

test("PQ-02 escapa XSS en la descripcion", () => {
  const h = renderQuotePage("t", { ...base, items: [{ description: "<script>alert(1)</script>", quantity: 1, unitPrice: 1, lineTotal: 1 }] });
  expect(h).not.toContain("<script>alert(1)</script>");
  expect(h).toContain("&lt;script&gt;");
});

test("PQ-03 decidida: muestra estado, sin botones", () => {
  const h = renderQuotePage("t", { ...base, decision: "accepted" });
  expect(h).toContain("Aceptaste");
  expect(h).not.toContain("/q/t/accept");
});
