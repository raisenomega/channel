import { expect, test } from "vitest";
import { SendMessageHandler, SendMessageCommand } from "../../../../src/channels/whatsapp-cloud/application/send-message.handler.ts";
import type { WhatsAppAdapterPort, SentMessage } from "../../../../src/channels/whatsapp-cloud/domain/whatsapp-adapter.port.ts";
import type { WhatsAppContent } from "../../../../src/channels/whatsapp-cloud/domain/message-content.vo.ts";
import type { MessagePersistenceRepo } from "../../../../src/channels/whatsapp-cloud/application/message-persistence.repo.ts";
import type { WhatsAppMessage } from "../../../../src/channels/whatsapp-cloud/domain/message.entity.ts";
import { ok, err } from "../../../../src/shared/domain/result.ts";
import type { Result } from "../../../../src/shared/domain/result.ts";

class MockAdapter implements WhatsAppAdapterPort {
  failNext = false;
  async enviarMensaje(_t: string, _f: string, _to: string, _c: WhatsAppContent): Promise<Result<SentMessage, string>> {
    return this.failNext ? err("mock_error") : ok({ wamid: "wamid.mock_001", status: "sent" });
  }
  async marcarLeido(_t: string, _p: string, _m: string): Promise<Result<void, string>> { return ok(undefined); }
}

class MockRepo implements MessagePersistenceRepo {
  messages: WhatsAppMessage[] = [];
  async guardar(m: WhatsAppMessage): Promise<Result<void, string>> { this.messages.push(m); return ok(undefined); }
  async buscarPorWamid(_w: string): Promise<Result<WhatsAppMessage | null, string>> { return ok(null); }
  async actualizarStatus(_w: string, _s: string, _e?: Record<string, string>): Promise<Result<void, string>> { return ok(undefined); }
}

test("enviar mensaje texto basico", async () => {
  const adapter = new MockAdapter();
  const repo = new MockRepo();
  const handler = new SendMessageHandler(adapter, repo);
  const cmd: SendMessageCommand = { tenantId: "t_1", phoneNumberId: "pn_123", toPhone: "+15551234567", content: { type: "text", body: "Hola!" } };
  const result = await handler.ejecutar(cmd);
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value.wamid).toBe("wamid.mock_001");
    expect(result.value.status).toBe("sent");
  }
  expect(repo.messages.length).toBe(1);
  expect(repo.messages[0].direction).toBe("outbound");
});

test("sin phoneNumberId retorna error", async () => {
  const adapter = new MockAdapter();
  const repo = new MockRepo();
  const handler = new SendMessageHandler(adapter, repo);
  const result = await handler.ejecutar({ tenantId: "t_1", phoneNumberId: "", toPhone: "+15551234567", content: { type: "text", body: "Hola" } });
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.kind).toBe("sin_phone_number_id");
});

test("telefono invalido retorna error", async () => {
  const adapter = new MockAdapter();
  const repo = new MockRepo();
  const handler = new SendMessageHandler(adapter, repo);
  const result = await handler.ejecutar({ tenantId: "t_1", phoneNumberId: "pn_1", toPhone: "12", content: { type: "text", body: "Hola" } });
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.kind).toBe("telefono_invalido");
});

test("adapter falla propaga error", async () => {
  const adapter = new MockAdapter();
  adapter.failNext = true;
  const repo = new MockRepo();
  const handler = new SendMessageHandler(adapter, repo);
  const result = await handler.ejecutar({ tenantId: "t_1", phoneNumberId: "pn_1", toPhone: "+15551234567", content: { type: "text", body: "Hola" } });
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.kind).toBe("envio_fallo");
});