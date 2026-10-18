import { expect, test, vi } from "vitest";
import { rutaWebhookVerify } from "../../../src/channels/whatsapp-cloud/presentation/routes/webhook.routes.ts";
import type { RequestContext } from "../../../src/server/server-types.ts";

test("A-N-8: token vacío -> verify_misconfigured (no acepta handshake)", async () => {
  vi.stubEnv("META_WEBHOOK_VERIFY_TOKEN", "");
  const ctx = { path: "/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=&hub.challenge=123" } as RequestContext;
  const r = await rutaWebhookVerify().handler(ctx);
  expect((r as { ok?: boolean; error?: { kind: string } }).error?.kind).toBe("verify_misconfigured");
  vi.unstubAllEnvs();
});
