/**
 * HUB by Raisen — O-4 adversariales A-O-4b/c del page picker FB (select-page).
 */
import { expect, test, vi, beforeEach } from "vitest";
vi.mock("../../../src/server/jwt-verify.ts", async (o) => {
  const a = await (o() as Promise<Record<string, unknown>>);
  return { ...a, parsearJwtClaims: async () => ({ ok: true, value: { userId: "u-fb", tenantId: "t-A", exp: 0 } }) };
});
vi.mock("../../../src/channels/infrastructure/zernio-facebook.client.ts", () => ({
  getFacebookPages: vi.fn(async () => ({ ok: true, value: [{ id: "pg-1", name: "Mi Pagina" }] })),
  selectFacebookPage: vi.fn(async () => ({ ok: true, value: { accountId: "acc-fb-1" } })),
}));
import { rutaSelectPage, rutaPendingPages } from "../../../src/channels/presentation/routes/fb-pages.routes.ts";
import { stashPending } from "../../../src/channels/infrastructure/oauth-pending-stash.ts";
import type { RequestContext } from "../../../src/server/server-types.ts";

const deps = (over: Record<string, unknown> = {}) => ({
  apiKey: "k",
  tenantRepo: { buscar: async () => ({ ok: true as const, value: { zernioProfileId: "prof-A" } }) },
  connRepo: { guardar: vi.fn(async () => ({ ok: true as const, value: undefined })) },
  ...over,
}) as never;
const ctx = (body: Record<string, unknown> = {}, path = "/tenants/t-A/channels/facebook/select-page"): RequestContext =>
  ({ path, headers: {}, params: {}, body }) as RequestContext;

beforeEach(() => { stashPending("u-fb", "t-A", "facebook", "TT", "CT", null); });

test("A-O-4 pending-pages lista las paginas del consent (desde el stash)", async () => {
  const r = await rutaPendingPages(deps()).handler(ctx({}, "/tenants/t-A/channels/facebook/pending-pages"));
  expect((r as { ok: boolean; pages: unknown[] }).pages.length).toBe(1);
});
test("A-O-4b select-page valido -> persiste channel_connection + accountId", async () => {
  const d = deps();
  const r = await rutaSelectPage(d).handler(ctx({ page_id: "pg-1" }));
  expect((r as { ok: boolean }).ok).toBe(true);
  expect((d as { connRepo: { guardar: { mock: { calls: unknown[] } } } }).connRepo.guardar.mock.calls.length).toBe(1);
});
test("A-O-4c select-page con page_id ajeno al profile -> 403", async () => {
  const d = deps();
  const r = await rutaSelectPage(d).handler(ctx({ page_id: "pg-AJENA" }));
  expect((r as { status?: number }).status).toBe(403);
  expect((d as { connRepo: { guardar: { mock: { calls: unknown[] } } } }).connRepo.guardar.mock.calls.length).toBe(0);
});
