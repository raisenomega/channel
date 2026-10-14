import { expect, test } from "vitest";
import { ChannelRouter } from "../../../src/channels/application/channel.router.ts";
import { ChannelAdapter, OutboundMessage, NormalizedMessage } from "../../../src/channels/domain/channel.adapter.ts";
import { ChannelType } from "../../../src/shared/domain/types.ts";

class MockAdapter implements ChannelAdapter {
  readonly provider = "zernio" as const;
  readonly supportedChannels: readonly ChannelType[] = ["whatsapp", "sms"];

  async sendMessage(_msg: OutboundMessage): Promise<{ ok: true; value: void }> {
    return { ok: true, value: undefined };
  }
  async sendTemplate(): Promise<{ ok: true; value: void }> {
    return { ok: true, value: undefined };
  }
  parseInboundWebhook(_payload: unknown): { ok: true; value: readonly NormalizedMessage[] } {
    return { ok: true, value: [] };
  }
  verifyWebhook(_sig: string, _body: string): boolean { return true; }
  async ping(): Promise<{ ok: true; value: boolean }> { return { ok: true, value: true }; }
}

test("ChannelRouter â€” debe registrar y resolver adapter", () => {
  const router = new ChannelRouter();
  router.registrar(new MockAdapter());
  const result = router.resolver("zernio");
  expect(result.ok).toBe(true);
  expect(result.value.provider).toBe("zernio");
});

test("ChannelRouter â€” debe fallar si adapter no estÃ¡ registrado", () => {
  const router = new ChannelRouter();
  const result = router.resolver("meta_direct");
  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("adapter_no_registrado");
});

test("ChannelRouter â€” debe enviar mensaje por el adapter correcto", async () => {
  const router = new ChannelRouter();
  router.registrar(new MockAdapter());
  const result = await router.enviar({ to: "+1787", content: "Hola", channel: "whatsapp" });
  expect(result.ok).toBe(true);
});

test("ChannelRouter â€” debe fallar si ningÃºn adapter soporta el canal", async () => {
  const router = new ChannelRouter();
  router.registrar(new MockAdapter());
  const result = await router.enviar({ to: "@test", content: "Hola", channel: "instagram" });
  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("canal_no_soportado");
});
