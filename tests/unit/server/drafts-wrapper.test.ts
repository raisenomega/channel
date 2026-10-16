import { expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { ok } from "../../../src/shared/domain/result.ts";
import { buildDraftsDeps } from "../../../src/server/drafts-wrapper.ts";
import { SendApprovedDraftService } from "../../../src/cognition/application/send-approved-draft.service.ts";
import { ChannelRouter } from "../../../src/channels/application/channel.router.ts";
import type { ChannelAdapter, OutboundMessage } from "../../../src/channels/domain/channel.adapter.ts";

/**
 * Hotfix H — H-SEV-1: drafts-wrapper ya NO inyecta un stub inline; recibe el
 * ChannelRouter real. Compuerta #19.
 */

test("SEV-1 a: router inyectado — buildDraftsDeps crea SendApprovedDraftService con el router (sin stub inline)", () => {
  const router = new ChannelRouter();
  const deps = buildDraftsDeps(router);
  expect(deps.send).toBeInstanceOf(SendApprovedDraftService);
  // All deps wired
  expect(typeof deps.approve.ejecutar).toBe("function");
  expect(typeof deps.reject.ejecutar).toBe("function");
  expect(typeof deps.feedback.ejecutar).toBe("function");
  expect(typeof deps.send.ejecutar).toBe("function");
  expect(deps.repo).toBeTruthy();
});

test("SEV-1 b: el stub inline sendMessage ya no existe en drafts-wrapper.ts", () => {
  const src = readFileSync("src/server/drafts-wrapper.ts", "utf8");
  expect(src).not.toContain("sendMessage: async () => ({ ok: true");
  expect(src).not.toContain("as ChannelAdapter");
});

test("SEV-1 c: router.enviar es la vía de dispatch — el servicio reenvía el mensaje aprobado via router", async () => {
  // Router real con adaptador spy.
  const called: OutboundMessage[] = [];
  const adapter: ChannelAdapter = {
    provider: "dev",
    supportedChannels: ["whatsapp", "email", "instagram", "facebook", "telegram", "sms", "x", "linkedin", "webchat"],
    sendMessage: async (msg) => { called.push(msg); return ok(undefined); },
    sendTemplate: async () => ok(undefined),
    parseInboundWebhook: () => ok(Object.freeze([])),
    verifyWebhook: async () => true,
    ping: async () => ok(true),
  };
  const router = new ChannelRouter();
  router.registrar(adapter);

  const repo = {
    obtenerPorId: async () => ok({ id: "d1", status: "approved", draftContent: "Hola {destinatario}", providerMessageId: null, sentAt: null }),
    marcarEnviado: async () => ok(undefined),
  } as never;

  const s = new SendApprovedDraftService(repo, router);
  const r = await s.ejecutar("d1", "+1787", "whatsapp");
  expect(r.ok).toBe(true);
  expect(called).toHaveLength(1);
  expect(called[0]).toEqual({ to: "+1787", content: "Hola {destinatario}", channel: "whatsapp" });
});

test("SEV-1 d: router.enviar devuelve error canal_no_soportado -> SEND_FAILED", async () => {
  const router = new ChannelRouter(); // sin adaptadores
  const repo = {
    obtenerPorId: async () => ok({ id: "d1", status: "approved", draftContent: "msg", providerMessageId: null, sentAt: null }),
    marcarEnviado: async () => ok(undefined),
  } as never;
  const s = new SendApprovedDraftService(repo, router);
  const r = await s.ejecutar("d1", "+1787", "email");
  expect(r.ok).toBe(false);
});