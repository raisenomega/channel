/**
 * HUB by Raisen — El envio resuelve los refs de Zernio (providerConversationId/AccountId) de la conversacion
 * y los pasa al router; sin ellos Zernio rechazaba el envio.
 */
import { expect, test } from "vitest";
import { SendApprovedDraftService, type ConvRefReader } from "../../../src/cognition/application/send-approved-draft.service.ts";
import type { AgentDraftsRepository } from "../../../src/cognition/infrastructure/agent-drafts.repository.ts";
import type { ChannelRouter } from "../../../src/channels/application/channel.router.ts";
import type { OutboundMessage } from "../../../src/channels/domain/channel.adapter.ts";
import { ok } from "../../../src/shared/domain/result.ts";

test("SEND-01 resuelve refs de la conversacion y los pasa al router", async () => {
  let sent: OutboundMessage | null = null;
  const repo = { obtenerPorId: async () => ok({ id: "d1", status: "approved", draftContent: "hola", conversationId: "conv1", metadata: {} }), marcarEnviado: async () => ok(undefined) } as unknown as AgentDraftsRepository;
  const router = { enviar: async (m: OutboundMessage) => { sent = m; return ok(undefined); } } as unknown as ChannelRouter;
  const convs = { buscar: async () => ok({ providerConversationId: "zconv", providerAccountId: "zacct" }) } as unknown as ConvRefReader;
  await new SendApprovedDraftService(repo, router, convs).ejecutar("d1", "+1", "instagram");
  expect(sent!.conversationId).toBe("zconv");
  expect(sent!.accountId).toBe("zacct");
});

test("SEND-02 sin refs (sin conv reader) -> no incluye conversationId (honesto)", async () => {
  let sent: OutboundMessage | null = null;
  const repo = { obtenerPorId: async () => ok({ id: "d1", status: "approved", draftContent: "hola", conversationId: null, metadata: {} }), marcarEnviado: async () => ok(undefined) } as unknown as AgentDraftsRepository;
  const router = { enviar: async (m: OutboundMessage) => { sent = m; return ok(undefined); } } as unknown as ChannelRouter;
  await new SendApprovedDraftService(repo, router).ejecutar("d1", "+1", "whatsapp");
  expect(sent!.conversationId).toBeUndefined();
});
