/**
 * HUB by Raisen — LEY captura: si faltan datos escanea el hilo COMPLETO (no solo 20); si ya esta completo, no re-escanea.
 */
import { expect, test } from "vitest";
import { MaybeCaptureService } from "../../../src/cognition/application/maybe-capture.service.ts";

function make(completo: boolean, sink: { extrajo: boolean; limite: number | undefined }) {
  const producer = { extraer: async () => { sink.extrajo = true; return {}; } };
  const leerHilo = async (_c: string, limite?: number) => { sink.limite = limite; return []; };
  const guardar = async () => [];
  const completos = async () => completo;
  return new MaybeCaptureService(producer as never, leerHilo as never, guardar as never, completos);
}
const ev = { contactId: "k", conversationId: "c" } as never;

test("CAP-01 contacto COMPLETO -> no re-escanea (lo recuerda del DB)", async () => {
  const sink = { extrajo: false, limite: undefined as number | undefined };
  await make(true, sink).ejecutar(ev);
  expect(sink.extrajo).toBe(false);
});

test("CAP-02 faltan datos -> escanea el hilo COMPLETO (limite 500)", async () => {
  const sink = { extrajo: false, limite: undefined as number | undefined };
  await make(false, sink).ejecutar(ev);
  expect(sink.extrajo).toBe(true);
  expect(sink.limite).toBe(500);
});
