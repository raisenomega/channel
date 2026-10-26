/**
 * HUB by Raisen — LEY ABSOLUTA DE DATOS: el sistema NO crea una cotizacion si faltan datos base del contacto.
 */
import { expect, test } from "vitest";
import { MaybeQuoteService } from "../../../src/cognition/application/maybe-quote.service.ts";
import { ok } from "../../../src/shared/domain/result.ts";

function make(datosCompletos: boolean, sink: { creada: boolean }) {
  const producer = { producir: async () => ok({ worth: true, lines: [{ description: "x", quantity: 1, unitPrice: 10 }], conclusion: "", identified: "", confidence: 80 }) };
  const leerCatalogo = async () => [{ sku: "A", name: "A", price: 10 }];
  const hayPendiente = async () => false;
  const persistir = async () => { sink.creada = true; };
  const leerHilo = async () => [{ from: "cliente" as const, text: "quiero cotizar" }];
  const datos = async () => datosCompletos;
  return new MaybeQuoteService(producer as never, leerCatalogo as never, hayPendiente, persistir as never, leerHilo as never, datos);
}
const ev = { tenantId: "t1", conversationId: "c1", contactId: "k1", content: "quiero una cotizacion", from: "+1", channel: "whatsapp", contactName: "Juan" } as never;

test("LEY-01 datos INCOMPLETOS -> NO se crea cotizacion", async () => {
  const sink = { creada: false };
  await make(false, sink).ejecutar(ev, true);
  expect(sink.creada).toBe(false);
});

test("LEY-02 datos COMPLETOS -> si se crea la cotizacion", async () => {
  const sink = { creada: false };
  await make(true, sink).ejecutar(ev, true);
  expect(sink.creada).toBe(true);
});
