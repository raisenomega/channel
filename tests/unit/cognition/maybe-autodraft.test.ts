/**
 * HUB by Raisen — S6: MaybeAutodraftService genera borrador SOLO si el negocio esta en 'supervised' y hay
 * texto; off o vacio -> no genera (seguro). El draft lleva from/channel/contactLabel del remitente.
 */
import { expect, test } from "vitest";
import { MaybeAutodraftService, type AutodraftFlagPort } from "../../../src/cognition/application/maybe-autodraft.service.ts";
import type { GenerateDraftHandler } from "../../../src/cognition/application/generate-draft.handler.ts";
import { ok } from "../../../src/shared/domain/result.ts";

interface Captured { normalizedMessage: { from: string; content: string }; contactLabel?: string; channel: string }
const flagOf = (m: string): AutodraftFlagPort => ({ leer: async () => m });
const genSpy = (calls: Captured[]): GenerateDraftHandler => ({ ejecutar: async (c: Captured) => { calls.push(c); return ok({ id: "d1" }); } } as unknown as GenerateDraftHandler);

test("S6-01 supervised + texto -> genera draft con from/channel/contactLabel", async () => {
  const calls: Captured[] = [];
  await new MaybeAutodraftService(flagOf("supervised"), genSpy(calls)).ejecutar({ tenantId: "t1", channel: "whatsapp", from: "+1787", content: "cuanto cuesta" });
  expect(calls).toHaveLength(1);
  expect(calls[0]!.normalizedMessage.from).toBe("+1787");
  expect(calls[0]!.contactLabel).toBe("+1787");
  expect(calls[0]!.channel).toBe("whatsapp");
});

test("S6-02 flag off -> NO genera (seguro)", async () => {
  const calls: Captured[] = [];
  await new MaybeAutodraftService(flagOf("off"), genSpy(calls)).ejecutar({ tenantId: "t1", channel: "whatsapp", from: "+1787", content: "hola" });
  expect(calls).toHaveLength(0);
});

test("S6-03 contenido vacio -> NO genera", async () => {
  const calls: Captured[] = [];
  await new MaybeAutodraftService(flagOf("supervised"), genSpy(calls)).ejecutar({ tenantId: "t1", channel: "whatsapp", from: "+1787", content: "   " });
  expect(calls).toHaveLength(0);
});
