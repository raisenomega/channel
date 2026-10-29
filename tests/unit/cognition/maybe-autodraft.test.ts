/**
 * HUB by Raisen — S6/S7b: genera borrador si no esta 'off'; auto-envia SOLO si autonomo + guardrails pasan.
 */
import { expect, test, vi } from "vitest";
vi.mock("../../../src/cognition/infrastructure/audio-transcribe.ts", () => ({ transcribirAudio: async () => "necesito una cotizacion de limpieza" }));
import { MaybeAutodraftService, type AutodraftFlagPort, type AutoSendPort, type SentCounterPort } from "../../../src/cognition/application/maybe-autodraft.service.ts";
import type { GenerateDraftHandler } from "../../../src/cognition/application/generate-draft.handler.ts";
import type { IntentClassifier, IntentResult } from "../../../src/cognition/application/intent-classifier.ts";
import { DEFAULT_CONFIG, type AgentsConfig } from "../../../src/cognition/domain/agents-config.ts";
import { ok } from "../../../src/shared/domain/result.ts";

const flagOf = (mode: string, config: AgentsConfig = DEFAULT_CONFIG): AutodraftFlagPort => ({ leer: async () => ({ mode, config }) });
const genSpy = (calls: { personaSlug: string; scope?: string }[]): GenerateDraftHandler => ({ ejecutar: async (c: { personaSlug: string; scope?: string }) => { calls.push(c); return ok({ id: "d1" }); } } as unknown as GenerateDraftHandler);
const clf = (r: IntentResult): IntentClassifier => ({ clasificar: async () => r } as unknown as IntentClassifier);
const sender = (sent: string[]): AutoSendPort => ({ enviar: async (_d, to: string, ch: string) => { sent.push(`${to}|${ch}`); } });
const counter = (n: number): SentCounterPort => ({ contar: async () => n });
const thao: IntentResult = { persona: "thao", opportunity: false, kind: "soporte", confidence: 9 };

test("S6-01 supervised -> genera draft (no auto-envia)", async () => {
  const calls: { personaSlug: string }[] = []; const sent: string[] = [];
  await new MaybeAutodraftService(flagOf("supervised"), genSpy(calls), clf(thao), sender(sent), counter(0)).ejecutar({ tenantId: "t1", channel: "whatsapp", from: "+1", content: "hola" });
  expect(calls).toHaveLength(1); expect(sent).toHaveLength(0);
});

test("S6-02 off -> NO genera", async () => {
  const calls: { personaSlug: string }[] = [];
  await new MaybeAutodraftService(flagOf("off"), genSpy(calls), clf(thao)).ejecutar({ tenantId: "t1", channel: "whatsapp", from: "+1", content: "hola" });
  expect(calls).toHaveLength(0);
});

test("S7b-01 autonomo + rutina + confianza alta -> AUTO-ENVIA", async () => {
  const calls: { personaSlug: string }[] = []; const sent: string[] = [];
  await new MaybeAutodraftService(flagOf("autonomous"), genSpy(calls), clf(thao), sender(sent), counter(0)).ejecutar({ tenantId: "t1", channel: "whatsapp", from: "+1787", content: "a que hora abren?" });
  expect(sent).toEqual(["+1787|whatsapp"]);
});

test("S7b-02 autonomo + confianza media -> RESPONDE IGUAL (default umbral 0)", async () => {
  const calls: { personaSlug: string }[] = []; const sent: string[] = [];
  await new MaybeAutodraftService(flagOf("autonomous"), genSpy(calls), clf({ ...thao, confidence: 5 }), sender(sent), counter(0)).ejecutar({ tenantId: "t1", channel: "whatsapp", from: "+1", content: "hola" });
  expect(sent).toHaveLength(1);
});

test("S7b-03 autonomo + OPORTUNIDAD -> RESPONDE en vivo (mantiene caliente; el cierre es Sistema B)", async () => {
  const sent: string[] = [];
  await new MaybeAutodraftService(flagOf("autonomous"), genSpy([]), clf({ persona: "zahra", opportunity: true, kind: "venta", confidence: 9 }), sender(sent), counter(0)).ejecutar({ tenantId: "t1", channel: "whatsapp", from: "+1", content: "quiero comprar" });
  expect(sent).toHaveLength(1);
});

test("S7b-04 autonomo + bloqueado (canal no autorizado) -> NO responde y NO deja borrador (anti-ruido Sistema A)", async () => {
  const calls: { personaSlug: string }[] = []; const sent: string[] = [];
  await new MaybeAutodraftService(flagOf("autonomous"), genSpy(calls), clf(thao), sender(sent), counter(0)).ejecutar({ tenantId: "t1", channel: "telegram", from: "+1", content: "hola" });
  expect(calls).toHaveLength(0); expect(sent).toHaveLength(0);
});

test("S7b-05 autonomo + OPORTUNIDAD a-revision (review.opportunities ON) -> NO envia pero DEJA BORRADOR (no se cae)", async () => {
  const calls: { personaSlug: string }[] = []; const sent: string[] = [];
  const cfg: AgentsConfig = { ...DEFAULT_CONFIG, review: { ...DEFAULT_CONFIG.review, opportunities: true } };
  await new MaybeAutodraftService(flagOf("autonomous", cfg), genSpy(calls), clf({ persona: "zahra", opportunity: true, kind: "venta", confidence: 9 }), sender(sent), counter(0)).ejecutar({ tenantId: "t1", channel: "whatsapp", from: "+1", content: "quiero los zafacones soterrados" });
  expect(calls).toHaveLength(1); // borrador creado (a tu revision), ya no se cae
  expect(sent).toHaveLength(0);  // NO auto-enviado
});

test("VOZ: nota de voz -> se transcribe y el agente LEE '[Nota de voz] ...' (STT)", async () => {
  const caps: Array<{ normalizedMessage?: { content: string } }> = [];
  const gen = { ejecutar: async (c: { normalizedMessage?: { content: string } }) => { caps.push(c); return ok({ id: "d1" }); } } as unknown as GenerateDraftHandler;
  await new MaybeAutodraftService(flagOf("supervised"), gen, clf(thao)).ejecutar({ tenantId: "t1", channel: "whatsapp", from: "+1", content: "[Audio]", contentType: "audio", mediaUrl: "https://zernio/x", mediaMime: "audio/ogg" });
  expect(caps[0]?.normalizedMessage?.content).toBe("[Nota de voz] necesito una cotizacion de limpieza");
});
