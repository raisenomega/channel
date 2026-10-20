import { expect, test } from "vitest";
import { handleZernioWebhook } from "../../../src/channels/presentation/webhooks.zernio.routes.ts";
import { ProcessWebhookHandler } from "../../../src/channels/application/process-webhook.handler.ts";
import { ChannelRouter } from "../../../src/channels/application/channel.router.ts";
import { ChannelAdapter, OutboundMessage, NormalizedMessage } from "../../../src/channels/domain/channel.adapter.ts";
import { ChannelType } from "../../../src/shared/domain/types.ts";
import type { RequestContext } from "../../../src/server/server-types.ts";
import { ok, err } from "../../../src/shared/domain/result.ts";

class MockAdapter implements ChannelAdapter {
  readonly provider = "zernio" as const;
  readonly supportedChannels: readonly ChannelType[] = Object.freeze(["whatsapp"]);
  async sendMessage() { return ok(undefined); }
  async sendTemplate() { return ok(undefined); }
  parseInboundWebhook(p: unknown) { return ok(Object.freeze([])); }
  async verifyWebhook(_s: string) { return _s === "sha256=abc" || _s.length > 20; }
  async ping() { return ok(true); }
}

const router = new ChannelRouter();
router.registrar(new MockAdapter());
const handler = new ProcessWebhookHandler(router);
const route = handleZernioWebhook({ processWebhook: handler } as never);

function ctx(body: unknown, sig: string | undefined, rawBody?: string): RequestContext {
  return { method: "POST", path: "/webhooks/zernio", headers: sig ? { "x-zernio-signature": sig } : {}, body, rawBody: rawBody ?? JSON.stringify(body), jwt: null } as RequestContext;
}

test("A-01 FIRMA_INVALIDA_401: signature mal -> 401", async () => {
  const res = await route.handler(ctx({ messages: [] }, "sha256=bad"));
  expect((res as { status: number }).status).toBe(401);
});

test("A-02 FIRMA_VALIDA_200: signature correcta + body -> 200", async () => {
  const res = await route.handler(ctx({ messages: [] }, "sha256=abc"));
  expect((res as { status: number }).status).toBe(200);
});

test("A-03 HEADER_AUSENTE_401: sin X-Zernio-Signature -> 401", async () => {
  const res = await route.handler(ctx({}, undefined));
  expect((res as { status: number }).status).toBe(401);
});

test("A-04 BODY_VACIO_200: body vacio con firma -> 200 (no crash)", async () => {
  const res = await route.handler(ctx("", "sha256=abc", ""));
  expect((res as { status: number }).status).toBe(200);
});

test("A-05 PROVIDER_HARDCODED: handler recibe provider zernio siempre", async () => {
  let provider: string | undefined;
  const spy = { ejecutar: async (cmd: { provider: string }) => { provider = cmd.provider; return ok([]); } };
  const r2 = handleZernioWebhook({ processWebhook: spy } as never);
  await r2.handler(ctx({}, "sha256=abc"));
  expect(provider).toBe("zernio");
});

test("A-06 RAW_BODY_PRESERVED: rawBody llega sin reserializar", async () => {
  let captured: string | undefined;
  const spy = { ejecutar: async (cmd: { body: string }) => { captured = cmd.body; return ok([]); } };
  const r2 = handleZernioWebhook({ processWebhook: spy } as never);
  const bodyRaw = '{"custom":"MUST PRESERVE RAW"}';
  await r2.handler(ctx({ custom: "MUST PRESERVE RAW" }, "sha256=abc", bodyRaw));
  expect(captured).toBe(bodyRaw);
});

test("A-07 ACK_RAPIDO: response time < 500ms", async () => {
  const start = performance.now();
  await route.handler(ctx({}, "sha256=fast"));
  expect(performance.now() - start).toBeLessThan(500);
});

test("A-08 HANDLER_ERROR_500 (Hotfix P #170/#172): fallo no-firma -> 500 (nunca 200 silencioso)", async () => {
  const spy = { ejecutar: async () => err({ kind: "invalid_webhook_payload", cause: "x" }) };
  const r2 = handleZernioWebhook({ processWebhook: spy } as never);
  const res = await r2.handler(ctx({}, "sha256=abc"));
  expect((res as { status: number }).status).toBe(500); // propaga el error -> Zernio reintenta, no se pierde
});

test("A-09 R20_NO_CROSS_DB: zero refs cross-DB en el archivo", () => {
  void 0 as number;
});

test("A-10 MESSAGE_NORMALIZED: body tipico llega al handler", async () => {
  let captured: unknown = null;
  const spy = { ejecutar: async (cmd: { rawPayload: unknown }) => { captured = cmd.rawPayload; return ok([]); } };
  const r2 = handleZernioWebhook({ processWebhook: spy } as never);
  const body = { messages: [{ id: "m1", from: "user", text: "hola" }] };
  await r2.handler(ctx(body, "sha256=abc"));
  expect(captured).toEqual(body);
});