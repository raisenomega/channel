/**
 * HUB by Raisen — S1: AgentContextService usa el contexto REAL del negocio (no placeholders) cuando hay
 * source; fallback honesto sin source. "Enriquece, no bloquea".
 */
import { expect, test } from "vitest";
import { AgentContextService, type AgentContextSource } from "../../../src/cognition/application/agent-context.ts";
import type { NormalizedMessage } from "../../../src/channels/domain/channel.adapter.ts";
import { ok } from "../../../src/shared/domain/result.ts";

const cmd = { providerMessageId: "m1", from: "+1", channel: "whatsapp", content: "hola", attachments: [] } as unknown as NormalizedMessage;

const fakeSource: AgentContextSource = {
  obtenerKnowledge: async () => ok(Object.freeze([])),
  obtenerHistorial: async () => ok(Object.freeze([])),
  obtenerNegocio: async () => ok({ brandVoice: "VOZ-REAL", catalogContext: "CAT-REAL" }),
};

test("ACX-01 con source: usa el contexto REAL del negocio (no placeholder)", async () => {
  const r = await new AgentContextService(fakeSource).obtener(cmd, "t1");
  expect(r.ok).toBe(true);
  if (r.ok) { expect(r.value.brandVoice).toBe("VOZ-REAL"); expect(r.value.catalogContext).toBe("CAT-REAL"); }
});

test("ACX-02 sin source: fallback honesto, no bloquea", async () => {
  const r = await new AgentContextService().obtener(cmd, "t1");
  expect(r.ok).toBe(true);
  if (r.ok) { expect(r.value.brandVoice).toContain("Profesional"); expect(r.value.history).toEqual([]); }
});

test("ACX-03 CEREBRO: obtener trae la memoria del source (chunks/facts) con la identidad del cliente", async () => {
  const calls: Array<{ idType: string; idValue: string; query: string; agent: string }> = [];
  const src: AgentContextSource = {
    ...fakeSource,
    obtenerMemoria: async (_t, idType, idValue, query, agent) => { calls.push({ idType, idValue, query, agent }); return Object.freeze(["cliente pidio 4 zafacones soterrados", "acepto oferta $19.99"]); },
  };
  const r = await new AgentContextService(src).obtener(cmd, "t1", undefined, "zahra");
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value.memoria).toEqual(["cliente pidio 4 zafacones soterrados", "acepto oferta $19.99"]);
  expect(calls[0]).toEqual({ idType: "phone", idValue: "+1", query: "hola", agent: "zahra" }); // identidad + persona correctas
});
