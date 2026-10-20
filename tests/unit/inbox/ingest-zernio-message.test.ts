/**
 * HUB by Raisen — Hotfix P bloque 2: ingesta del webhook REAL de Zernio (fixture = payload de prod,
 * IG a Zafacones Ramos). Verifica persist (contacto+conversación+message), idempotencia (#154),
 * resolución de tenant por profileId (#157) y rechazo de shapes ajenos. Deps mockeadas.
 */
import { expect, test, vi } from "vitest";
import { readFileSync } from "node:fs";
import { IngestZernioMessageHandler, type IngestDeps } from "../../../src/inbox/application/ingest-zernio-message.use-case.ts";

const PAYLOAD = {
  event: "message.received",
  message: {
    id: "6ad6cfc1b4beafdb004c9417", platform: "instagram", direction: "incoming", text: "Saludos Zafacones Ramos",
    sender: { id: "1774346600215945", name: "Johanny | Community Manager", username: "johannylizpr" },
  },
  conversation: { id: "6a3dcaa29d9472faaeea9423", participantId: "1774346600215945", participantName: "Johanny | Community Manager" },
  account: { id: "6ad59c380f7c39ef909f2f2b", profileId: "6ad59b1c685fd27eccca02cb", platform: "instagram" },
};

function build(over: Partial<IngestDeps> = {}) {
  const guardarOk = async () => ({ ok: true as const, value: undefined });
  const contacts = { guardar: vi.fn(guardarOk) } as unknown as IngestDeps["contacts"];
  const convs = { guardar: vi.fn(guardarOk) } as unknown as IngestDeps["convs"];
  const msgs = { guardar: vi.fn(guardarOk) } as unknown as IngestDeps["msgs"];
  const d: IngestDeps = {
    contacts, convs, msgs,
    tenantPorProfile: vi.fn(async () => "t-1" as never),
    tenantPorAccount: vi.fn(async () => null),
    mensajeExiste: vi.fn(async () => false),
    convExiste: vi.fn(async () => false),
    setParticipant: vi.fn(async () => {}),
    refreshContactName: vi.fn(async () => {}),
    detId: (s: string) => `det-${s}`,
    ...over,
  };
  return { d, contacts, convs, msgs };
}

test("P-2 persist: mensaje IG real -> contacto + conversación + message insertados", async () => {
  const { d, contacts, convs, msgs } = build();
  const r = await new IngestZernioMessageHandler(d).ejecutar(PAYLOAD);
  expect(r).toEqual({ ok: true, value: { persisted: true } });
  expect(contacts.guardar).toHaveBeenCalledOnce();
  expect(convs.guardar).toHaveBeenCalledOnce();
  const msg = (msgs.guardar as ReturnType<typeof vi.fn>).mock.calls[0][0];
  expect(msg).toMatchObject({
    tenantId: "t-1", channel: "instagram", direction: "inbound", provider: "zernio",
    providerMessageId: "6ad6cfc1b4beafdb004c9417", status: "received", content: { type: "text", body: "Saludos Zafacones Ramos" },
  });
});

test("P-2 idempotente: provider_message_id ya existe -> persisted:false, no inserta", async () => {
  const { d, msgs } = build({ mensajeExiste: vi.fn(async () => true) });
  const r = await new IngestZernioMessageHandler(d).ejecutar(PAYLOAD);
  expect(r).toEqual({ ok: true, value: { persisted: false } });
  expect(msgs.guardar).not.toHaveBeenCalled();
});

test("P-2 tenant no encontrado (profileId Y accountId sin match) -> error, no persiste", async () => {
  const { d, msgs } = build({ tenantPorProfile: vi.fn(async () => null), tenantPorAccount: vi.fn(async () => null) });
  const r = await new IngestZernioMessageHandler(d).ejecutar(PAYLOAD);
  expect(r.ok).toBe(false);
  expect(msgs.guardar).not.toHaveBeenCalled();
});

test("Issue C: profileId NO matchea pero accountId SI (channel_connections) -> resuelve tenant + persiste", async () => {
  const { d, msgs } = build({ tenantPorProfile: vi.fn(async () => null), tenantPorAccount: vi.fn(async () => "t-1" as never) });
  const r = await new IngestZernioMessageHandler(d).ejecutar(PAYLOAD);
  expect(r).toEqual({ ok: true, value: { persisted: true } });
  expect((msgs.guardar as ReturnType<typeof vi.fn>).mock.calls[0][0]).toMatchObject({ tenantId: "t-1" });
});

test("P-2 shape ajeno (otro event) -> shape_ignorado, no toca DB", async () => {
  const { d, contacts } = build();
  const r = await new IngestZernioMessageHandler(d).ejecutar({ event: "message.deleted" });
  expect(r.ok).toBe(false);
  expect(contacts.guardar).not.toHaveBeenCalled();
});

test("P-3 CAUSA RAIZ: migracion 053 crea la particion DEFAULT de messages (sin ella TODO insert falla)", () => {
  const sql = readFileSync("supabase/migrations/053_messages_default_partition.sql", "utf8");
  expect(sql).toMatch(/PARTITION OF public\.messages DEFAULT/);
});

test("Issue A: conversacion YA existe -> NO re-crea contacto/conv (no resetea), solo inserta el mensaje", async () => {
  const { d, contacts, convs, msgs } = build({ convExiste: vi.fn(async () => true) });
  const r = await new IngestZernioMessageHandler(d).ejecutar(PAYLOAD);
  expect(r).toEqual({ ok: true, value: { persisted: true } });
  expect(contacts.guardar).not.toHaveBeenCalled();
  expect(convs.guardar).not.toHaveBeenCalled();
  expect(msgs.guardar).toHaveBeenCalledOnce();
});

test("3o-b: conv YA existe -> backfill del id destino (setParticipant) con el participantId del webhook", async () => {
  const setParticipant = vi.fn(async () => {});
  const { d } = build({ convExiste: vi.fn(async () => true), setParticipant });
  await new IngestZernioMessageHandler(d).ejecutar(PAYLOAD);
  expect(setParticipant).toHaveBeenCalledWith(expect.any(String), "1774346600215945");
});

test("#3 nombre: SALIENTE sin participantName -> contacto 'Cliente' (NUNCA el negocio/remitente)", async () => {
  const { d, contacts } = build();
  const out = { ...PAYLOAD, event: "message.sent", message: { ...PAYLOAD.message, direction: "outgoing", sender: { id: "biz", name: "Zafacones Ramos" } }, conversation: { id: "cv" } };
  await new IngestZernioMessageHandler(d).ejecutar(out);
  const c = (contacts.guardar as ReturnType<typeof vi.fn>).mock.calls[0][0];
  expect(c.displayName).toBe("Cliente");
});

test("#3 auto-update: conv existe + llega nombre real -> refreshContactName con ese nombre", async () => {
  const refreshContactName = vi.fn(async () => {});
  const { d } = build({ convExiste: vi.fn(async () => true), refreshContactName });
  await new IngestZernioMessageHandler(d).ejecutar(PAYLOAD);
  expect(refreshContactName).toHaveBeenCalledWith(expect.any(String), "Johanny | Community Manager");
});

test("Issue A: migracion 054 crea trigger que incrementa total_messages + last_message_at", () => {
  const sql = readFileSync("supabase/migrations/054_messages_count_trigger.sql", "utf8");
  expect(sql).toMatch(/AFTER INSERT ON public\.messages/);
  expect(sql).toMatch(/total_messages = total_messages \+ 1/);
  expect(sql).toMatch(/last_message_at = NEW\.created_at/);
});

test("Issue B media: text=null + ig_reel -> content '[Reel]' + has_attachments=true", async () => {
  const { d, msgs } = build();
  const mediaPayload = { ...PAYLOAD, message: { ...PAYLOAD.message, text: null, attachments: [{ type: "video", originalType: "ig_reel", url: "https://ig/reel/x" }] } };
  await new IngestZernioMessageHandler(d).ejecutar(mediaPayload);
  const msg = (msgs.guardar as ReturnType<typeof vi.fn>).mock.calls[0][0];
  expect(msg.content.body).toBe("[Reel]");
  expect(msg.hasAttachments).toBe(true);
});

test("Bloque 4 outbound: message.sent -> direction outbound + senderType human_agent + status sent", async () => {
  const { d, msgs } = build();
  const out = { ...PAYLOAD, event: "message.sent", message: { ...PAYLOAD.message, direction: "outgoing", text: "respuesta" } };
  const r = await new IngestZernioMessageHandler(d).ejecutar(out);
  expect(r).toEqual({ ok: true, value: { persisted: true } });
  const msg = (msgs.guardar as ReturnType<typeof vi.fn>).mock.calls[0][0];
  expect(msg).toMatchObject({ direction: "outbound", senderType: "human_agent", status: "sent", content: { body: "respuesta" } });
});

test("Issue #3: migracion 055 (re)crea la politica RLS por tenant de messages (sin ella RLS niega todo -> inbox 200 [])", () => {
  const sql = readFileSync("supabase/migrations/055_messages_rls_policy_restore.sql", "utf8");
  expect(sql).toMatch(/CREATE POLICY "tenant_isolation_messages" ON public\.messages/);
  expect(sql).toMatch(/tenant_id = current_tenant\(\)/);
  expect(sql).toMatch(/tenant_isolation_messages_default" ON public\.messages_default/);
});

test("P-3 insert falla -> propaga el error REAL del repo (diagnosticable, no 'mensaje' generico)", async () => {
  const msgs = { guardar: vi.fn(async () => ({ ok: false as const, error: { kind: "persistence_failure", cause: 'no partition of relation "messages" found for row' } })) } as unknown as IngestDeps["msgs"];
  const { d } = build({ msgs });
  const r = await new IngestZernioMessageHandler(d).ejecutar(PAYLOAD);
  expect(r.ok).toBe(false);
  expect((r as { error: { cause: string } }).error.cause).toContain("no partition");
});
