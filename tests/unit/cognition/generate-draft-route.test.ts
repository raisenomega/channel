/**
 * HUB by Raisen — S4a: la ruta toma el ULTIMO mensaje entrante de la conversacion y genera un draft;
 * rechaza (404) si la conversacion no es del tenant del claim.
 */
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { SignJWT } from "jose";
import { rutaGenerateDraft, type GenerateDraftDeps } from "../../../src/cognition/presentation/generate-draft.routes.ts";
import type { HttpResponse, RequestContext } from "../../../src/server/server-types.ts";
import { ok } from "../../../src/shared/domain/result.ts";

const SECRET = "test-supabase-jwt-secret-which-is-long-enough-32char";
async function bearer(t: string): Promise<string> {
  const j = await new SignJWT({ sub: "u1", tenant_id: t }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("1h").sign(new TextEncoder().encode(SECRET));
  return `Bearer ${j}`;
}
function ctx(convId: string, authz: string): RequestContext {
  return { method: "POST", path: `/tenants/t1/conversations/${convId}/generate-draft`, headers: { authorization: authz }, body: {}, rawBody: null, jwt: null, params: Object.freeze({ id: "t1", conversationId: convId }) };
}
const conv = { ok: true as const, value: { id: "conv1", tenantId: "t1", contactId: "ct1", primaryChannel: "whatsapp", participantExternalId: "+1787" } };
const msgs = { ok: true as const, value: [{ direction: "outbound", content: { body: "hola" } }, { direction: "inbound", content: { body: "viejo" } }, { direction: "inbound", content: { body: "cuanto cuesta" } }] };
const deps = (generate: unknown): GenerateDraftDeps => ({ generate, conversations: { buscar: async () => conv }, messages: { buscarPorConversacion: async () => msgs } } as unknown as GenerateDraftDeps);

beforeEach(() => { vi.stubEnv("SUPABASE_JWT_SECRET", SECRET); });
afterEach(() => { vi.unstubAllEnvs(); });

test("S4a-01 toma el ULTIMO inbound y genera draft (200)", async () => {
  let captured: { normalizedMessage: { content: string; from: string }; channel: string } | null = null;
  const generate = { ejecutar: async (c: typeof captured) => { captured = c; return ok({ id: "d1" }); } };
  const r = await rutaGenerateDraft(deps(generate)).handler(ctx("conv1", await bearer("t1"))) as HttpResponse;
  expect(r.status).toBe(200);
  expect(captured!.normalizedMessage.content).toBe("cuanto cuesta");
  expect(captured!.normalizedMessage.from).toBe("+1787");
  expect(captured!.channel).toBe("whatsapp");
});

test("S4a-02 conversacion de otro tenant -> 404", async () => {
  const generate = { ejecutar: async () => ok({ id: "d1" }) };
  const r = await rutaGenerateDraft(deps(generate)).handler(ctx("conv1", await bearer("OTRO"))) as HttpResponse;
  expect(r.status).toBe(404);
});
