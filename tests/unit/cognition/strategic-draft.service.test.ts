/**
 * HUB by Raisen — Sistema B 2b: las reglas de decision (stop/no-repetir/umbral) del borrador de cierre.
 */
import { expect, test } from "vitest";
import { StrategicDraftService, type StrategicDeps } from "../../../src/cognition/application/strategic-draft.service.ts";
import type { QuietConv } from "../../../src/cognition/application/followup-scanner.ts";
import type { ClosingDraftProducer } from "../../../src/cognition/application/closing-draft.producer.ts";
import { ok } from "../../../src/shared/domain/result.ts";

const conv = (ageH: number): QuietConv => ({ id: "c1", tenantId: "t1", contactId: "k1", lastMessageAt: new Date(Date.now() - ageH * 3_600_000).toISOString() });
const cerradorCon = (worth: boolean, confidence: number): ClosingDraftProducer => ({ producir: () => Promise.resolve(ok({ worth, message: "m", conclusion: "c", identified: "i", confidence })) } as unknown as ClosingDraftProducer);
function deps(persisted: QuietConv[], over: Partial<StrategicDeps> = {}): StrategicDeps {
  return { leerHilo: () => Promise.resolve([{ from: "cliente", text: "cuanto?" }]), estadoSeguimiento: () => Promise.resolve({ intentos: 0, ultimoBorradorAt: null }), contextoNegocio: () => Promise.resolve("Zafacones"), cerrador: cerradorCon(true, 70), persistir: (c) => { persisted.push(c); return Promise.resolve(); }, umbralConfianza: 50, maxIntentos: 2, maxDiasViejo: 30, ...over };
}

test("SB2b-01 worth + conf>=umbral -> persiste", async () => {
  const p: QuietConv[] = [];
  const r = await new StrategicDraftService(deps(p)).procesar(conv(6));
  expect(r).toContain("borrador_creado"); expect(p).toHaveLength(1);
});
test("SB2b-02 conf<umbral -> descarta", async () => {
  const p: QuietConv[] = [];
  const r = await new StrategicDraftService(deps(p, { cerrador: cerradorCon(true, 30) })).procesar(conv(6));
  expect(r).toContain("descartado"); expect(p).toHaveLength(0);
});
test("SB2b-03 max intentos -> para", async () => {
  const p: QuietConv[] = [];
  const r = await new StrategicDraftService(deps(p, { estadoSeguimiento: () => Promise.resolve({ intentos: 2, ultimoBorradorAt: null }) })).procesar(conv(6));
  expect(r).toBe("max_intentos"); expect(p).toHaveLength(0);
});
test("SB2b-04 ya hubo nudge este episodio -> no repite", async () => {
  const p: QuietConv[] = [];
  const r = await new StrategicDraftService(deps(p, { estadoSeguimiento: () => Promise.resolve({ intentos: 1, ultimoBorradorAt: new Date().toISOString() }) })).procesar(conv(6));
  expect(r).toBe("ya_nudge_este_episodio"); expect(p).toHaveLength(0);
});
test("SB2b-05 hilo muy viejo -> ignora", async () => {
  const p: QuietConv[] = [];
  const r = await new StrategicDraftService(deps(p)).procesar(conv(40 * 24));
  expect(r).toBe("muy_viejo"); expect(p).toHaveLength(0);
});
