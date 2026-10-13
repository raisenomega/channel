import { assertEquals, assert } from "jsr:@std/assert";
import { ConnectChannelHandler } from "../../../src/channels/application/connect-channel.handler.ts";
import { InboxRepository } from "../../../src/channels/domain/channels.repository.ts";

const TEST_TENANT = crypto.randomUUID() as never;

Deno.test("ConnectChannelHandler — debe crear inbox y retornar id", async () => {
  const mockRepo: InboxRepository = {
    guardar: async (_i) => ({ ok: true, value: undefined }),
    buscar: async (_id) => ({ ok: true, value: null }),
    buscarPorTenant: async (_tid) => ({ ok: true, value: [] }),
    buscarPorCanal: async (_tid, _ch) => ({ ok: true, value: [] }),
  };
  const handler = new ConnectChannelHandler(mockRepo);
  const result = await handler.ejecutar({
    tenantId: TEST_TENANT, name: "WhatsApp", channelType: "whatsapp", provider: "zernio",
  });
  assert(result.ok);
  assertEquals(typeof result.value, "string");
});

Deno.test("ConnectChannelHandler — debe fallar si el repo falla", async () => {
  const mockRepo: InboxRepository = {
    guardar: async (_i) => ({ ok: false, error: { kind: "persistence_failure", cause: "DB down" } }),
    buscar: async (_id) => ({ ok: true, value: null }),
    buscarPorTenant: async (_tid) => ({ ok: true, value: [] }),
    buscarPorCanal: async (_tid, _ch) => ({ ok: true, value: [] }),
  };
  const handler = new ConnectChannelHandler(mockRepo);
  const result = await handler.ejecutar({
    tenantId: TEST_TENANT, name: "Email", channelType: "email", provider: "resend",
  });
  assert(!result.ok);
  assertEquals(result.error.kind, "persistence_failure");
});