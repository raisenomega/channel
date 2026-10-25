/**
 * HUB by Raisen — P2: parse de la propuesta de cotizacion del agente + totales. Robusto a basura del LLM.
 */
import { expect, test } from "vitest";
import { parseQuoteProposal, totales } from "../../../src/cognition/domain/quote-proposal.ts";

test("QP-01 JSON valido -> worth + lineas parseadas", () => {
  const r = parseQuoteProposal('{"worth":true,"lines":[{"description":"Logo","quantity":1,"unitPrice":150},{"description":"Flyer","quantity":2,"unitPrice":25}],"conclusion":"pidio logo","identified":"quiere comprar","confidence":80}');
  expect(r.ok).toBe(true);
  if (r.ok) { expect(r.value.worth).toBe(true); expect(r.value.lines.length).toBe(2); expect(r.value.confidence).toBe(80); }
});

test("QP-02 linea invalida (sin precio) se descarta", () => {
  const r = parseQuoteProposal('{"worth":true,"lines":[{"description":"Logo","quantity":1,"unitPrice":150},{"description":"Roto","quantity":1}],"conclusion":"x","identified":"y","confidence":50}');
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value.lines.length).toBe(1);
});

test("QP-03 sin lineas -> worth=false aunque el LLM diga true", () => {
  const r = parseQuoteProposal('{"worth":true,"lines":[],"conclusion":"","identified":"","confidence":90}');
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value.worth).toBe(false);
});

test("QP-04 confidence fuera de rango -> clamp 0-100", () => {
  const r = parseQuoteProposal('{"worth":true,"lines":[{"description":"A","quantity":1,"unitPrice":10}],"conclusion":"","identified":"","confidence":250}');
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value.confidence).toBe(100);
});

test("QP-05 JSON basura -> error honesto", () => {
  expect(parseQuoteProposal("lo siento no puedo").ok).toBe(false);
});

test("QP-06 totales = suma de qty*precio", () => {
  const { subtotal, total } = totales([{ description: "A", quantity: 2, unitPrice: 10 }, { description: "B", quantity: 1, unitPrice: 5.5 }]);
  expect(subtotal).toBe(25.5); expect(total).toBe(25.5);
});
