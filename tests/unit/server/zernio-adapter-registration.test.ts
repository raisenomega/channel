import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { createHmac } from "node:crypto";

// Env minimo ANTES de los imports: supabase.client.ts hace Deno.exit(1) sin estas vars.
vi.hoisted(() => {
  const base: Record<string, string> = {
    SUPABASE_URL: "https://vault.test.local", SUPABASE_SERVICE_ROLE_KEY: "k", SUPABASE_JWT_SECRET: "jwt-test",
    STRIPE_SECRET_KEY: "sk_test_x", STRIPE_WEBHOOK_SECRET: "whsec_x", STRIPE_API_VERSION: "2024-10-28.acacia",
    ATH_MOVIL_STUB: "1", CSRF_SECRET: "c".repeat(64), HUB_PUBLIC_URL: "http://localhost:18080",
  };
  for (const [k, v] of Object.entries(base)) process.env[k] = v;
});
import "../../../src/server/deno-polyfill.ts";
import { buildChannelRouter } from "../../../src/server/channel-router-wrapper.ts";
import { buildHandlers } from "../../../src/server/server-routes.ts";
import type { ServerHandlers } from "../../../src/server/server-routes.ts";
import { ZernioAdapter } from "../../../src/channels/infrastructure/zernio.adapter.ts";
import { ZernioCredentialsRepository } from "../../../src/channels/infrastructure/zernio.credentials.ts";
import { ProcessWebhookHandler } from "../../../src/channels/application/process-webhook.handler.ts";
import { handleZernioWebhook } from "../../../src/channels/presentation/webhooks.zernio.routes.ts";
import type { RequestContext } from "../../../src/server/server-types.ts";
import { ok } from "../../../src/shared/domain/result.ts";

const ORIGINAL_FETCH = globalThis.fetch;
const VAULT_SECRET = "vault-webhook-secret-at-least-32-chars-long";
const ENV_SECRET = "env-webhook-secret-at-least-32-chars-long!!";
const BODY = '{"messages":[]}';

function vaultOk(apiKey: string, secret: string): void {
  const respuestas = [apiKey, secret].map((v) => new Response(JSON.stringify(v), { status: 200, headers: { "content-type": "application/json" } }));
  globalThis.fetch = vi.fn().mockImplementation(async () => respuestas.shift() ?? new Response(null, { status: 404 }));
}
function vault404(): void {
  globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 404 }));
}
function setEnvCreds(secret: string): void {
  process.env["ZERNIO_API_KEY"] = "env-api-key";
  process.env["ZERNIO_WEBHOOK_SECRET"] = secret;
}
function clearEnvCreds(): void {
  delete process.env["ZERNIO_API_KEY"];
  delete process.env["ZERNIO_WEBHOOK_SECRET"];
}
function firmar(body: string, secret: string): string {
  return "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
}
function ctx(sig: string): RequestContext {
  return { method: "POST", path: "/webhooks/zernio", headers: { "x-zernio-signature": sig }, body: JSON.parse(BODY), rawBody: BODY, jwt: null, params: Object.freeze({}) };
}
async function routerConWarn(): Promise<{ router: Awaited<ReturnType<typeof buildChannelRouter>>; warns: string[] }> {
  const warns: string[] = [];
  const router = await buildChannelRouter({ creds: new ZernioCredentialsRepository(), warn: (m) => { warns.push(m); } });
  return { router, warns };
}
async function responder(sig: string): Promise<{ status: number; body: string }> {
  const { router } = await routerConWarn();
  const h = { processWebhook: new ProcessWebhookHandler(router) } as ServerHandlers;
  const r = await handleZernioWebhook(h).handler(ctx(sig));
  return r as { status: number; body: string };
}

beforeEach(() => { clearEnvCreds(); });
afterEach(() => { globalThis.fetch = ORIGINAL_FETCH; clearEnvCreds(); });

test("A-01 Vault ok -> router.resolver('zernio') es ZernioAdapter", async () => {
  vaultOk("vault-api-key", VAULT_SECRET);
  const { router, warns } = await routerConWarn();
  const r = router.resolver("zernio");
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value).toBeInstanceOf(ZernioAdapter);
  expect(warns).toEqual([]);
});

test("A-02 Vault err + env presente -> adapter registrado desde env", async () => {
  vault404();
  setEnvCreds(ENV_SECRET);
  const { router, warns } = await routerConWarn();
  expect(router.resolver("zernio").ok).toBe(true);
  expect(warns).toEqual([]);
});

test("A-03 Vault err + env ausente -> sin adapter, sin crash, warn sin secretos", async () => {
  vault404();
  const { router, warns } = await routerConWarn();
  const r = router.resolver("zernio");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("adapter_no_registrado");
  expect(warns).toHaveLength(1);
  expect(warns[0]).toContain("ZernioAdapter NO registrado: CREDENCIAL_AUSENTE:ZERNIO_API_KEY");
  expect(warns[0]).not.toContain(VAULT_SECRET);
  expect(warns[0]).not.toContain(ENV_SECRET);
});

test("A-04 DevChannelAdapter sigue registrado tras el wire-up", async () => {
  vaultOk("vault-api-key", VAULT_SECRET);
  const { router } = await routerConWarn();
  expect(router.resolver("dev").ok).toBe(true);
});

test("A-05 Firma invalida -> 401 signature_invalid (nunca adapter_no_registrado)", async () => {
  vaultOk("vault-api-key", VAULT_SECRET);
  const r = await responder("sha256=invalid");
  expect(r.status).toBe(401);
  expect(r.body).toContain("signature_invalid");
  expect(r.body).not.toContain("adapter_no_registrado");
});

test("A-06 Firma HMAC valida con el secret -> 200 ok:true events:[]", async () => {
  vaultOk("vault-api-key", VAULT_SECRET);
  const r = await responder(firmar(BODY, VAULT_SECRET));
  expect(r.status).toBe(200);
  expect(JSON.parse(r.body)).toEqual({ ok: true, events: [] });
});

test("A-07 buildHandlers es async: retorna Promise y resuelve con processWebhook", async () => {
  vault404();
  const p = buildHandlers();
  expect(typeof p.then).toBe("function");
  const handlers = await p;
  expect(handlers.processWebhook).toBeInstanceOf(ProcessWebhookHandler);
});

test("A-08 leer() se llama exactamente 1 vez al construir el router", async () => {
  class SpyCreds extends ZernioCredentialsRepository {
    llamadas = 0;
    override async leer(): ReturnType<ZernioCredentialsRepository["leer"]> {
      this.llamadas += 1;
      return ok(Object.freeze({ apiKey: "spy-key", webhookSecret: VAULT_SECRET }));
    }
  }
  const spy = new SpyCreds();
  await buildChannelRouter({ creds: spy, warn: () => undefined });
  expect(spy.llamadas).toBe(1);
});

test("A-09 Creds de leer() congeladas tanto desde Vault como desde env", async () => {
  vaultOk("vault-api-key", VAULT_SECRET);
  const desdeVault = await new ZernioCredentialsRepository().leer();
  expect(desdeVault.ok && Object.isFrozen(desdeVault.value)).toBe(true);
  vault404();
  setEnvCreds(ENV_SECRET);
  const desdeEnv = await new ZernioCredentialsRepository().leer();
  expect(desdeEnv.ok && Object.isFrozen(desdeEnv.value)).toBe(true);
});

test("A-10 Vault ok + env presente -> se usa Vault, NUNCA env", async () => {
  vaultOk("vault-api-key", VAULT_SECRET);
  setEnvCreds(ENV_SECRET);
  const conVault = await responder(firmar(BODY, VAULT_SECRET));
  expect(conVault.status).toBe(200);
  vaultOk("vault-api-key", VAULT_SECRET);
  const conEnv = await responder(firmar(BODY, ENV_SECRET));
  expect(conEnv.status).toBe(401);
});
