import { assertEquals, assert } from "jsr:@std/assert";
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

Deno.test("ChannelRouter — debe registrar y resolver adapter", () => {
  const router = new ChannelRouter();
  router.registrar(new MockAdapter());
  const result = router.resolver("zernio");
  assert(result.ok);
  assertEquals(result.value.provider, "zernio");
});

Deno.test("ChannelRouter — debe fallar si adapter no está registrado", () => {
  const router = new ChannelRouter();
  const result = router.resolver("meta_direct");
  assert(!result.ok);
  assertEquals(result.error.kind, "adapter_no_registrado");
});

Deno.test("ChannelRouter — debe enviar mensaje por el adapter correcto", async () => {
  const router = new ChannelRouter();
  router.registrar(new MockAdapter());
  const result = await router.enviar({ to: "+1787", content: "Hola", channel: "whatsapp" });
  assert(result.ok);
});

Deno.test("ChannelRouter — debe fallar si ningún adapter soporta el canal", async () => {
  const router = new ChannelRouter();
  router.registrar(new MockAdapter());
  const result = await router.enviar({ to: "@test", content: "Hola", channel: "instagram" });
  assert(!result.ok);
  assertEquals(result.error.kind, "canal_no_soportado");
});