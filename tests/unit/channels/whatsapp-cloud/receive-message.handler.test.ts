import { expect, test } from "vitest";
import { ReceiveMessageHandler } from "../../../../src/channels/whatsapp-cloud/application/receive-message.handler.ts";
import type { MessagePersistenceRepo } from "../../../../src/channels/whatsapp-cloud/application/message-persistence.repo.ts";
import type { WhatsAppMessage } from "../../../../src/channels/whatsapp-cloud/domain/message.entity.ts";
import { ok } from "../../../../src/shared/domain/result.ts";
import type { Result } from "../../../../src/shared/domain/result.ts";

class MockRepo implements MessagePersistenceRepo {
  messages: WhatsAppMessage[] = [];
  existingWamid: string | null = null;
  async guardar(m: WhatsAppMessage): Promise<Result<void, string>> { this.messages.push(m); return ok(undefined); }
  async buscarPorWamid(w: string): Promise<Result<WhatsAppMessage | null, string>> {
    if (w === this.existingWamid) return ok(this.messages.find(m => m.wamid === w) ?? null);
    return ok(null);
  }
  async actualizarStatus(_w: string, _s: string, _e?: Record<string, string>): Promise<Result<void, string>> { return ok(undefined); }
  setExistingWamid(w: string) { this.existingWamid = w; }
}

test("recibir mensaje texto basico", async () => {
  const repo = new MockRepo();
  const handler = new ReceiveMessageHandler(repo);
  const result = await handler.ejecutar("t_1", { wamid: "wamid.in_001", fromPhone: "+521234567890", toPhone: "pn_123", phoneNumberId: "pn_123", content: { type: "text", body: "Hola mundo" }, timestamp: "2025-01-01T00:00:00Z" });
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.value.processed).toBe(true);
  expect(repo.messages.length).toBe(1);
});

test("idempotencia: wamid duplicado ignorado", async () => {
  const repo = new MockRepo();
  const handler = new ReceiveMessageHandler(repo);
  const inbound = { wamid: "wamid.dup", fromPhone: "+521234567890", toPhone: "pn_1", phoneNumberId: "pn_1", content: { type: "text", body: "Hola" }, timestamp: "2025-01-01T00:00:00Z" };
  const r1 = await handler.ejecutar("t_1", inbound);
  expect(r1.ok).toBe(true);
  if (r1.ok) expect(r1.value.processed).toBe(true);
  repo.setExistingWamid("wamid.dup");
  const r2 = await handler.ejecutar("t_1", inbound);
  expect(r2.ok).toBe(true);
  if (r2.ok) expect(r2.value.processed).toBe(false);
  expect(repo.messages.length).toBe(1); // no se duplico
});

test("payload sin wamid retorna error", async () => {
  const repo = new MockRepo();
  const handler = new ReceiveMessageHandler(repo);
  const result = await handler.ejecutar("t_1", { wamid: "", fromPhone: "+521234567890", toPhone: "pn_1", phoneNumberId: "pn_1", content: { type: "text", body: "Hola" }, timestamp: "" });
  expect(result.ok).toBe(false);
});