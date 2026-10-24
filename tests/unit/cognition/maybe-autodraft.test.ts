/**
 * HUB by Raisen — S6 + proactivo: MaybeAutodraftService genera borrador SOLO si 'supervised' + hay texto.
 * El clasificador decide el agente autor y marca oportunidad (scope). off/vacio -> no genera (seguro).
 */
import { expect, test } from "vitest";
import { MaybeAutodraftService, type AutodraftFlagPort } from "../../../src/cognition/application/maybe-autodraft.service.ts";
import type { GenerateDraftHandler } from "../../../src/cognition/application/generate-draft.handler.ts";
import type { IntentClassifier, IntentResult } from "../../../src/cognition/application/intent-classifier.ts";
import { ok } from "../../../src/shared/domain/result.ts";

interface Captured { normalizedMessage: { from: string; content: string }; contactLabel?: string; channel: string; personaSlug: string; scope?: string }
const flagOf = (m: string): AutodraftFlagPort => ({ leer: async () => m });
const genSpy = (calls: Captured[]): GenerateDraftHandler => ({ ejecutar: async (c: Captured) => { calls.push(c); return ok({ id: "d1" }); } } as unknown as GenerateDraftHandler);
const clf = (r: IntentResult): IntentClassifier => ({ clasificar: async () => r } as unknown as IntentClassifier);
const thao: IntentResult = { persona: "thao", opportunity: false, kind: "soporte" };

test("S6-01 supervised + texto -> genera draft con from/channel/contactLabel", async () => {
  const calls: Captured[] = [];
  await new MaybeAutodraftService(flagOf("supervised"), genSpy(calls), clf(thao)).ejecutar({ tenantId: "t1", channel: "whatsapp", from: "+1787", content: "cuanto cuesta" });
  expect(calls).toHaveLength(1);
  expect(calls[0]!.normalizedMessage.from).toBe("+1787");
  expect(calls[0]!.contactLabel).toBe("+1787");
  expect(calls[0]!.channel).toBe("whatsapp");
});

test("S6-02 flag off -> NO genera (seguro)", async () => {
  const calls: Captured[] = [];
  await new MaybeAutodraftService(flagOf("off"), genSpy(calls), clf(thao)).ejecutar({ tenantId: "t1", channel: "whatsapp", from: "+1787", content: "hola" });
  expect(calls).toHaveLength(0);
});

test("S6-03 contenido vacio -> NO genera", async () => {
  const calls: Captured[] = [];
  await new MaybeAutodraftService(flagOf("supervised"), genSpy(calls), clf(thao)).ejecutar({ tenantId: "t1", channel: "whatsapp", from: "+1787", content: "   " });
  expect(calls).toHaveLength(0);
});

test("S6-04 proactivo: clasifica venta -> persona zahra + scope opportunity", async () => {
  const calls: Captured[] = [];
  await new MaybeAutodraftService(flagOf("supervised"), genSpy(calls), clf({ persona: "zahra", opportunity: true, kind: "venta" })).ejecutar({ tenantId: "t1", channel: "instagram", from: "@juan", content: "quiero comprar 3 zafacones" });
  expect(calls[0]!.personaSlug).toBe("zahra");
  expect(calls[0]!.scope).toBe("opportunity");
});
