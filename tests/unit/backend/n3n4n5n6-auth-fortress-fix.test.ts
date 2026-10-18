import { expect, test } from "vitest";
import { readFileSync } from "node:fs";
import type { RequestContext } from "../../../src/server/server-types.ts";
import { handleListInbox } from "../../../src/server/server-routes-commerce.ts";
import { handleSend, handleReceive } from "../../../src/server/server-routes-messaging.ts";

const noAuth = (path: string, method: string): RequestContext =>
  ({ method, path, headers: {}, body: {}, rawBody: null, jwt: null, params: {} }) as RequestContext;
const h = {} as never; // nunca se alcanza: requireTenantAuth falla antes.

test("A-N-3: GET /api/inbox/list sin JWT -> 401", async () => {
  const r = await handleListInbox(h).handler(noAuth("/api/inbox/list", "GET"));
  expect((r as { status?: number }).status).toBe(401);
});
test("A-N-5: POST /api/message/send sin JWT -> 401", async () => {
  const r = await handleSend(h).handler(noAuth("/api/message/send", "POST"));
  expect((r as { status?: number }).status).toBe(401);
});
test("A-N-6: POST /api/message/receive sin JWT -> 401", async () => {
  const r = await handleReceive(h).handler(noAuth("/api/message/receive", "POST"));
  expect((r as { status?: number }).status).toBe(401);
});
test("A-N-4: /auth/meta/init exige requireTenantAuth y deriva tenant del claim (no body)", () => {
  const SRC = readFileSync("src/channels/meta/presentation/routes/oauth.routes.ts", "utf8");
  expect(SRC).toContain("requireTenantAuth");
  expect(SRC).toContain("tid(auth.value.tenantId)");
  expect(SRC).not.toContain('tid(b["tenantId"] as string)');
});
