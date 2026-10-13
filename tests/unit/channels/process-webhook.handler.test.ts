import { assertEquals, assert } from "jsr:@std/assert";
import { ProcessWebhookHandler, ProcessWebhookCommand } from "../../../src/channels/application/process-webhook.handler.ts";
import { ChannelRouter } from "../../../src/channels/application/channel.router.ts";
import { ChannelAdapter, NormalizedMessage, OutboundMessage } from "../../../src/channels/domain/channel.adapter.ts";
import { ChannelType } from "../../../src/shared/domain/types.ts";

class ZernioMockAdapter implements ChannelAdapter {
  readonly provider = "zernio" as const;
  readonly supportedChannels: readonly ChannelType[] = ["whatsapp"];

  verifyWebhook(_sig: string, _body: string): boolean {
    return _sig === "valid_sig";
  }

  parseInboundWebhook(_payload: unknown) {
    return {
      ok: true as const,
      value: Object.freeze([
        Object.freeze({
          providerMessageId: "ext-1",
          from: "+17871234567",
          channel: "whatsapp" as ChannelType,
          content: "Hola",
          attachments: Object.freeze([]),
        }),
      ]),
    };
  }

  async sendMessage(_msg: OutboundMessage) {
    return { ok: true as const, value: undefined };
  }
  async sendTemplate() {
    return { ok: true as const, value: undefined };
  }
  async ping() {
    return { ok: true as const, value: true };
  }
}

Deno.test("ProcessWebhookHandler — debe parsear webhook exitosamente con firma valida", () => {
  const router = new ChannelRouter();
  router.registrar(new ZernioMockAdapter());

  const handler = new ProcessWebhookHandler(router);
  const cmd: ProcessWebhookCommand = {
    provider: "zernio",
    signature: "valid_sig",
    body: '{"dummy":true}',
    rawPayload: { entry: [] },
  };
  const result = handler.ejecutar(cmd);

  assert(result.ok);
  assertEquals(result.value.length, 1);
  assertEquals(result.value[0].content, "Hola");
});

Deno.test("ProcessWebhookHandler — debe fallar con firma_invalida si verifyWebhook da false", () => {
  const router = new ChannelRouter();
  router.registrar(new ZernioMockAdapter());

  const handler = new ProcessWebhookHandler(router);
  const cmd: ProcessWebhookCommand = {
    provider: "zernio",
    signature: "bad_sig",
    body: '{}',
    rawPayload: {},
  };
  const result = handler.ejecutar(cmd);

  assert(!result.ok);
  assertEquals(result.error.kind, "firma_invalida");
});

Deno.test("ProcessWebhookHandler — debe fallar con adapter_no_registrado si provider desconocido", () => {
  const router = new ChannelRouter();

  const handler = new ProcessWebhookHandler(router);
  const cmd: ProcessWebhookCommand = {
    provider: "twilio",
    signature: "abc",
    body: '{}',
    rawPayload: {},
  };
  const result = handler.ejecutar(cmd);

  assert(!result.ok);
  assertEquals(result.error.kind, "adapter_no_registrado");
  assertEquals(result.error.provider, "twilio");
});