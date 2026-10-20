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
  conversation: { id: "6a3dcaa29d9472faaeea9423" },
  account: { profileId: "6a3cc50bc079e49d88f08656", platform: "instagram" },
};

function build(over: Partial<IngestDeps> = {}) {
  const guardarOk = async () => ({ ok: true as const, value: undefined });
  const contacts = { guardar: vi.fn(guardarOk) } as unknown as IngestDeps["contacts"];
  const convs = { guardar: vi.fn(guardarOk) } as unknown as IngestDeps["convs"];
  const msgs = { guardar: vi.fn(guardarOk) } as unknown as IngestDeps["msgs"];
  const d: IngestDeps = {
    contacts, convs, msgs,
    tenantPorProfile: vi.fn(async () => "t-1" as never),
    mensajeExiste: vi.fn(async () => false),
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

test("P-2 tenant no encontrado (profileId sin match) -> error, no persiste", async () => {
  const { d, msgs } = build({ tenantPorProfile: vi.fn(async () => null) });
  const r = await new IngestZernioMessageHandler(d).ejecutar(PAYLOAD);
  expect(r.ok).toBe(false);
  expect(msgs.guardar).not.toHaveBeenCalled();
});

test("P-2 shape ajeno (otro event) -> shape_ignorado, no toca DB", async () => {
  const { d, contacts } = build();
  const r = await new IngestZernioMessageHandler(d).ejecutar({ event: "message.sent" });
  expect(r.ok).toBe(false);
  expect(contacts.guardar).not.toHaveBeenCalled();
});

test("P-3 CAUSA RAIZ: migracion 053 crea la particion DEFAULT de messages (sin ella TODO insert falla)", () => {
  const sql = readFileSync("supabase/migrations/053_messages_default_partition.sql", "utf8");
  expect(sql).toMatch(/PARTITION OF public\.messages DEFAULT/);
});

test("P-3 insert falla -> propaga el error REAL del repo (diagnosticable, no 'mensaje' generico)", async () => {
  const msgs = { guardar: vi.fn(async () => ({ ok: false as const, error: { kind: "persistence_failure", cause: 'no partition of relation "messages" found for row' } })) } as unknown as IngestDeps["msgs"];
  const { d } = build({ msgs });
  const r = await new IngestZernioMessageHandler(d).ejecutar(PAYLOAD);
  expect(r.ok).toBe(false);
  expect((r as { error: { cause: string } }).error.cause).toContain("no partition");
});
