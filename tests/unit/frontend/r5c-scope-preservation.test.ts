/**
 * HUB by Raisen — R-5c (Compuerta #66): crear un cliente/contacto JAMAS muta el scope de sesion.
 * Arquitectura real: en HUB los contactos se crean via RPC Supabase (POST {base}/rpc/create_contact,
 * SECURITY DEFINER que pone el tenant del usuario) + Bearer existente — NO re-emite sesion. El test
 * ejerce el cliente real (crearContacto) y valida:
 *   (1) hub.session queda intacta (el scope vive en el claim tenant_id del JWT, no en 'hub.tenant'),
 *   (2) la respuesta no trae token/session/tenant (crear cliente no re-emite sesion),
 *   (3) se reusa el Bearer existente (POST /rpc/create_contact, sin nueva auth ni Set-Cookie).
 */
import { expect, test, vi, beforeEach, afterEach } from "vitest";

const FUTURE = Math.floor(Date.now() / 1000) + 3600;
const b64u = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
const TOKEN = `${b64u({ alg: "HS256", typ: "JWT" })}.${b64u({ sub: "userA", tenant_id: "tenantA-uuid", exp: FUTURE })}.sig`;
const SESSION = JSON.stringify({ access_token: TOKEN, user: { id: "userA" } });

beforeEach(() => {
  (globalThis as Record<string, unknown>)["__HUB_CONFIG__"] = { supabaseUrl: "https://proj.test", anonKey: "anon-key" };
  window.localStorage.setItem("hub.session", SESSION);
});
afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
  delete (globalThis as Record<string, unknown>)["__HUB_CONFIG__"];
});

async function crear() {
  const { crearContacto } = await import("@/lib/contacts-client/functions");
  return crearContacto({ display_name: "Cliente Test", primary_phone: "+17875551234" });
}

test("A-R-5c-1: crear cliente NO muta hub.session (scope de sesion intacto)", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify("c1"), { status: 200 })));
  const before = window.localStorage.getItem("hub.session");
  const r = await crear();
  expect(r.ok).toBe(true);
  expect(window.localStorage.getItem("hub.session")).toBe(before);
});

test("A-R-5c-2: la respuesta NO trae token/session/tenant (crear cliente no re-emite sesion)", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify("c1"), { status: 200 })));
  const r = await crear();
  expect(r.ok).toBe(true);
  if (r.ok) {
    expect(r.value).not.toHaveProperty("token");
    expect(r.value).not.toHaveProperty("session");
    expect(r.value).not.toHaveProperty("tenant");
  }
});

test("A-R-5c-3: reusa el Bearer existente — POST /rpc/create_contact, sin nueva auth", async () => {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify("c1"), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  await crear();
  const [u, opts] = fetchMock.mock.calls[0] as unknown as [string, { method: string; headers: Record<string, string> }];
  expect(String(u)).toContain("/rest/v1/rpc/create_contact");
  expect(opts.method).toBe("POST");
  expect(opts.headers.authorization).toBe(`Bearer ${TOKEN}`);
});
