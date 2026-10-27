/**
 * HUB by Raisen — LEY ABSOLUTA DE DATOS: el sistema NO crea cotizacion si faltan los 4 datos; y SI dispara
 * cuando el contacto YA los tiene aunque el mensaje no pida (fix "tiene los datos y no dispara"), sin duplicar.
 */
import { expect, test } from "vitest";
import { MaybeQuoteService } from "../../../src/cognition/application/maybe-quote.service.ts";
import { ok } from "../../../src/shared/domain/result.ts";

function make(datosCompletos: boolean, sink: { creada: boolean; enviada: boolean }, pendienteTok: string | null = null) {
  const producer = { producir: async () => ok({ worth: true, lines: [{ description: "x", quantity: 1, unitPrice: 10 }], conclusion: "", identified: "", confidence: 80 }) };
  const leerCatalogo = async () => [{ sku: "A", name: "A", price: 10 }];
  const pendiente = async (): Promise<string | null> => pendienteTok;
  const persistir = async () => { sink.creada = true; return "tok"; };
  const leerHilo = async () => [{ from: "cliente" as const, text: "quiero cotizar" }];
  const datos = async () => datosCompletos;
  const enviar = async () => { sink.enviada = true; };
  return new MaybeQuoteService(producer as never, leerCatalogo as never, pendiente, persistir as never, leerHilo as never, datos, enviar);
}
const ev = { tenantId: "t1", conversationId: "c1", contactId: "k1", content: "quiero una cotizacion", from: "+1", channel: "whatsapp", contactName: "Juan" } as never;
const evSinIntent = { tenantId: "t1", conversationId: "c1", contactId: "k1", content: "ok perfecto gracias", from: "+1", channel: "whatsapp", contactName: "Juan" } as never;

test("LEY-01 datos INCOMPLETOS -> NO se crea cotizacion", async () => {
  const sink = { creada: false, enviada: false };
  await make(false, sink).ejecutar(ev, true, "autonomous");
  expect(sink.creada).toBe(false);
  expect(sink.enviada).toBe(false);
});

test("LEY-02 datos COMPLETOS -> si se crea la cotizacion", async () => {
  const sink = { creada: false, enviada: false };
  await make(true, sink).ejecutar(ev, true, "supervised");
  expect(sink.creada).toBe(true);
  expect(sink.enviada).toBe(false); // supervisado: NO auto-envia
});

test("LEY-03 AUTONOMO + datos completos -> crea Y envia al cliente (resumen+link)", async () => {
  const sink = { creada: false, enviada: false };
  await make(true, sink).ejecutar(ev, true, "autonomous");
  expect(sink.creada).toBe(true);
  expect(sink.enviada).toBe(true);
});

test("LEY-04 SIN pedido explicito pero datos COMPLETOS -> DISPARA (ley: si tiene los 4 datos, dispara)", async () => {
  const sink = { creada: false, enviada: false };
  await make(true, sink).ejecutar(evSinIntent, false, "autonomous"); // 'ok perfecto gracias' no pide cotizar
  expect(sink.creada).toBe(true);
  expect(sink.enviada).toBe(true);
});

test("LEY-05 datos completos SIN intencion pero YA hay cotizacion -> NO duplica (dedup)", async () => {
  const sink = { creada: false, enviada: false };
  await make(true, sink, "tok-previo").ejecutar(evSinIntent, false, "autonomous");
  expect(sink.creada).toBe(false); // ya existe: no se crea otra por 'datos-completos'
  expect(sink.enviada).toBe(false);
});

test("LEY-06 pedido EXPLICITO con cotizacion previa -> SI crea nueva ('otra con 4')", async () => {
  const sink = { creada: false, enviada: false };
  await make(true, sink, "tok-previo").ejecutar(ev, true, "autonomous"); // explicito ignora el dedup
  expect(sink.creada).toBe(true);
});
