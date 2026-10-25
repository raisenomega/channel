/**
 * HUB by Raisen — B4: el system prompt del agente incluye el perfil del contacto (segmento) para personalizar.
 */
import { expect, test } from "vitest";
import { AgentReasoner } from "../../../src/cognition/application/agent-reasoner.ts";
import type { AIProvider } from "../../../src/cognition/domain/ai-provider.ts";
import type { AgentContext } from "../../../src/cognition/application/agent-context.ts";
import type { NormalizedMessage } from "../../../src/channels/domain/channel.adapter.ts";
import { ok } from "../../../src/shared/domain/result.ts";

const spyAI = (sink: { p: string }): AIProvider => ({ completar: (q: { systemPrompt: string }) => { sink.p = q.systemPrompt; return Promise.resolve(ok({ response: "hola", usedModel: "m", usedTier: "haiku", costUsd: 0 })); } } as unknown as AIProvider);
const msg = { providerMessageId: "m1", from: "+1", channel: "whatsapp", content: "hola", attachments: [] } as unknown as NormalizedMessage;

test("B4-01 con perfil -> el prompt lo incluye y pide personalizar", async () => {
  const sink = { p: "" };
  const ctx: AgentContext = { knowledge: [], history: [], brandVoice: "zafacones", catalogContext: "items", contactProfile: "Johanny | recurrente | 3 ordenes previas" };
  await new AgentReasoner(spyAI(sink)).razonar(msg, "whatsapp", ctx);
  expect(sink.p).toContain("Contacto: Johanny | recurrente");
  expect(sink.p).toContain("VIP=trato prioritario");
});

test("B4-02 sin perfil -> no agrega la linea de contacto", async () => {
  const sink = { p: "" };
  const ctx: AgentContext = { knowledge: [], history: [], brandVoice: "b", catalogContext: "c" };
  await new AgentReasoner(spyAI(sink)).razonar(msg, "whatsapp", ctx);
  expect(sink.p).not.toContain("Contacto:");
});
