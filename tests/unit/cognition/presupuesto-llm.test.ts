/**
 * HUB by Raisen — #7 presupuesto LLM por tenant: si el gasto del dia supera el tope, el pipeline DEGRADA
 * (no_send) SIN llamar al LLM (ni classifier ni reasoner). Si esta bajo el tope, el flujo sigue normal.
 */
import { expect, test } from "vitest";
import { MaybeAutodraftService } from "../../../src/cognition/application/maybe-autodraft.service.ts";

const ev = { tenantId: "t1", channel: "whatsapp", from: "123", content: "hola" } as never;
const flag = (mode: string) => ({ leer: async () => ({ mode, config: {} as never }) });

test("PRES-01 presupuesto excedido -> no_send SIN tocar el LLM", async () => {
  let llamoLLM = false;
  const classifier = { clasificar: async () => { llamoLLM = true; return { persona: "eco", kind: "x", opportunity: false, confidence: 5 }; } };
  const generate = { ejecutar: async () => { llamoLLM = true; return { ok: false, error: { kind: "x" } }; } };
  const svc = new MaybeAutodraftService(flag("autonomous") as never, generate as never, classifier as never, undefined, undefined, undefined, undefined, undefined, undefined, async () => true);
  const r = await svc.ejecutar(ev);
  expect(r).toEqual({ outcome: "no_send", reason: "presupuesto_llm" });
  expect(llamoLLM).toBe(false);
});

test("PRES-02 bajo el tope -> el flujo sigue (llama al classifier)", async () => {
  let llamoClassifier = false;
  const classifier = { clasificar: async () => { llamoClassifier = true; return { persona: "eco", kind: "x", opportunity: false, confidence: 5 }; } };
  const generate = { ejecutar: async () => ({ ok: false, error: { kind: "llm_failure" } }) };
  const svc = new MaybeAutodraftService(flag("supervisado") as never, generate as never, classifier as never, undefined, undefined, undefined, undefined, undefined, undefined, async () => false);
  await svc.ejecutar(ev);
  expect(llamoClassifier).toBe(true);
});

test("PRES-03 sin gate configurado -> no corta (comportamiento previo intacto)", async () => {
  let llamoClassifier = false;
  const classifier = { clasificar: async () => { llamoClassifier = true; return { persona: "eco", kind: "x", opportunity: false, confidence: 5 }; } };
  const generate = { ejecutar: async () => ({ ok: false, error: { kind: "llm_failure" } }) };
  const svc = new MaybeAutodraftService(flag("supervisado") as never, generate as never, classifier as never);
  await svc.ejecutar(ev);
  expect(llamoClassifier).toBe(true);
});
