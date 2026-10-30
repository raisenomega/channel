/**
 * HUB by Raisen — PR4 lazo cerrado: el agente evalua el hilo tras la respuesta del dueno. Confirma + marca
 * listo para cerrar (satisfecho) o pregunta seguimiento; y SIEMPRE aprende cuando hay regla. Nunca evalua
 * si no hay respuestas o ya esta cerrada. Orquestador puro, con ports falsos.
 */
import { expect, test } from "vitest";
import { evaluarLazoConsulta, type LoopPorts, type LoopThread } from "../../../src/cognition/application/consulta-close-loop.ts";
import type { ConsultaVerdict } from "../../../src/cognition/application/consulta-eval.producer.ts";

function ports(thread: LoopThread | null, verdict: ConsultaVerdict | null) {
  const calls = { escribir: [] as Array<{ texto: string; satisfecho: boolean }>, aprender: [] as string[], evaluado: 0 };
  const p: LoopPorts = {
    leer: async () => thread,
    negocio: async () => "contexto",
    evaluar: async () => { calls.evaluado++; return verdict; },
    escribir: async (_t, _c, texto, satisfecho) => { calls.escribir.push({ texto, satisfecho }); },
    aprender: async (_t, _c, _p, aprendizaje) => { calls.aprender.push(aprendizaje); },
  };
  return { p, calls };
}

test("LAZO-01 satisfecho -> confirma (listo para cerrar) y aprende", async () => {
  const { p, calls } = ports({ pregunta: "precio?", respuestas: ["$95 por zafacon con agua"], resuelta: false }, { satisfecho: true, mensaje: "Recibido, entiendo. Listo, puedes cerrar.", aprendizaje: "zafacon con agua = $95" });
  await evaluarLazoConsulta(p, "t1", "c1");
  expect(calls.escribir).toEqual([{ texto: "Recibido, entiendo. Listo, puedes cerrar.", satisfecho: true }]);
  expect(calls.aprender).toEqual(["zafacon con agua = $95"]);
});

test("LAZO-02 no satisfecho -> pregunta seguimiento; aprende solo si hay regla", async () => {
  const { p, calls } = ports({ pregunta: "precio?", respuestas: ["depende"], resuelta: false }, { satisfecho: false, mensaje: "Me falta: cuanto por tapa?", aprendizaje: "" });
  await evaluarLazoConsulta(p, "t1", "c1");
  expect(calls.escribir).toEqual([{ texto: "Me falta: cuanto por tapa?", satisfecho: false }]);
  expect(calls.aprender).toEqual([]); // aprendizaje vacio -> no guarda ruido
});

test("LAZO-03 sin respuestas o ya resuelta -> no evalua ni escribe", async () => {
  const sinResp = ports({ pregunta: "x", respuestas: [], resuelta: false }, null);
  await evaluarLazoConsulta(sinResp.p, "t1", "c1");
  expect(sinResp.calls.evaluado).toBe(0);
  const cerrada = ports({ pregunta: "x", respuestas: ["ya"], resuelta: true }, null);
  await evaluarLazoConsulta(cerrada.p, "t1", "c1");
  expect(cerrada.calls.evaluado).toBe(0);
  expect(cerrada.calls.escribir).toEqual([]);
});
