/**
 * HUB by Raisen — Integration tests for BC Notifications (Slice 3).
 * Flujo + 5 adversariales de bank-grade.
 */
import { expect, test, vi } from "vitest";
import { EmitNotificationHandler } from "../../../src/notifications/application/emit-notification.handler.ts";
import { GetNotificationsHandler } from "../../../src/notifications/application/get-notifications.handler.ts";
import { MarkReadHandler } from "../../../src/notifications/application/mark-read.handler.ts";
import { UpdatePreferencesHandler } from "../../../src/notifications/application/update-preferences.handler.ts";
import type { Notification } from "../../../src/notifications/domain/notification.entity.ts";
import type { NotificationPreference } from "../../../src/notifications/domain/notification-preference.entity.ts";
import type { NotificationType } from "../../../src/notifications/domain/notification-type.vo.ts";
import type { NotificationRepository, NotificationQuery } from "../../../src/notifications/application/notification.repo.ts";
import type { NotificationEmitter } from "../../../src/notifications/application/notification-emitter.port.ts";
import { ok, err } from "../../../src/shared/domain/result.ts";
import type { Result } from "../../../../src/shared/domain/result.ts";

class InMemoryRepo implements NotificationRepository {
  notifications: Notification[] = [];
  prefs: Map<string, NotificationPreference> = new Map();

  async guardar(n: Notification): Promise<Result<void, string>> { this.notifications.push(n); return ok(undefined); }
  async listar(userId: string, q: NotificationQuery): Promise<Result<Notification[], string>> {
    let r = this.notifications.filter(n => n.userId === userId);
    if (q.unread) r = r.filter(n => !n.readAt);
    return ok(r.slice(0, q.limit ?? 20));
  }
  async marcarLeida(id: string, userId: string): Promise<Result<void, string>> {
    const n = this.notifications.find(x => x.id === id && x.userId === userId);
    if (n && !n.readAt) this.notifications.splice(this.notifications.indexOf(n), 1, { ...n, readAt: new Date().toISOString() });
    return ok(undefined);
  }
  async obtenerPreferencia(userId: string): Promise<Result<NotificationPreference | null, string>> { return ok(this.prefs.get(userId) ?? null); }
  async upsertPreferencia(pref: Pick<NotificationPreference, "userId" | "tenantId" | "inAppEnabled" | "emailEnabled" | "pushEnabled" | "mutedTypes">): Promise<Result<void, string>> {
    this.prefs.set(pref.userId, { id: pref.userId, tenantId: pref.tenantId, userId: pref.userId, inAppEnabled: pref.inAppEnabled, emailEnabled: pref.emailEnabled, pushEnabled: pref.pushEnabled, mutedTypes: pref.mutedTypes, updatedAt: new Date().toISOString() });
    return ok(undefined);
  }
  async esTipoSilenciado(userId: string, type: NotificationType): Promise<Result<boolean, string>> {
    const p = this.prefs.get(userId);
    return ok(p ? p.mutedTypes.includes(type) : false);
  }
}

class MockEmitter implements NotificationEmitter {
  fail = false;
  async emitir(_n: Notification, _t: string): Promise<Result<void, string>> { return this.fail ? err("down") : ok(undefined); }
}

test("flujo: emitir para tenant A, listar user A", async () => {
  const repo = new InMemoryRepo();
  const emit = new EmitNotificationHandler(repo, new MockEmitter());
  const get = new GetNotificationsHandler(repo);
  await emit.ejecutar({ tenantId: "t_A", userId: "u_A", type: "message_received", title: "Msj", body: "Hola", payload: { wamid: "w1" } });
  const r = await get.ejecutar({ userId: "u_A" });
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value.length).toBe(1);
});

test("adversarial 1: cross-tenant lookup falla (user A tenant X no ve tenant Y)", async () => {
  const repo = new InMemoryRepo();
  repo.notifications.push({ id: "n_priv", tenantId: "t_Y", userId: "u_B", type: "message_received", severity: "info", title: "Privado", createdAt: "2025-01-01" });
  const get = new GetNotificationsHandler(repo);
  // user A de tenant X intenta listar -> el repo filtra por userId, no encuentra el de tenant Y
  const r = await get.ejecutar({ userId: "u_A" });
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value.find(n => n.id === "n_priv")).toBeUndefined();
});

test("adversarial 2: mark-read idempotente (segunda vez no sobreescribe)", async () => {
  const repo = new InMemoryRepo();
  repo.notifications.push({ id: "n_idem", tenantId: "t_A", userId: "u_A", type: "signup_completed", severity: "info", title: "Listo", readAt: "2025-01-01T10:00:00Z", createdAt: "2025-01-01" });
  const before = repo.notifications[0].readAt;
  const mark = new MarkReadHandler(repo);
  await mark.ejecutar({ id: "n_idem", userId: "u_A" }); // ya leida, no re-escribe
  expect(repo.notifications[0].readAt).toBe(before);
});

test("adversarial 4: realtime failure no rompe caller", async () => {
  const repo = new InMemoryRepo();
  const emitter = new MockEmitter();
  emitter.fail = true;
  const emit = new EmitNotificationHandler(repo, emitter);
  const result = await emit.ejecutar({ tenantId: "t_A", userId: "u_A", type: "message_received", title: "Msj" });
  expect(result.ok).toBe(true); // best-effort
  expect(repo.notifications.length).toBe(1); // persistido
});

test("adversarial 3: muted type no persiste", async () => {
  const repo = new InMemoryRepo();
  const emit = new EmitNotificationHandler(repo, new MockEmitter());
  await repo.upsertPreferencia({ userId: "u_muted", tenantId: "t_A", inAppEnabled: true, emailEnabled: false, pushEnabled: false, mutedTypes: ["signup_completed"] });
  const r = await emit.ejecutar({ tenantId: "t_A", userId: "u_muted", type: "signup_completed", title: "Silenciado" });
  expect(r.ok).toBe(false); // no se persiste porque el tipo esta silenciado
  expect(repo.notifications.length).toBe(0);
});

test("adversarial 5: permisos de preferencias (requiere identidad autenticada)", async () => {
  const repo = new InMemoryRepo();
  const update = new UpdatePreferencesHandler(repo);
  // El userId siempre deriva del contexto autenticado (JWT claims), nunca del input del cliente.
  const sinAuth = await update.ejecutar({ userId: "", tenantId: "t_A" });
  expect(sinAuth.ok).toBe(false);
});

// ─── Sprint 2: rutas reales con JWT ───────────────────────────────
import { rutaGetNotifications, rutaMarkRead } from "../../../src/notifications/presentation/routes/notifications.routes.ts";
import type { NotificationsHandlers } from "../../../src/notifications/presentation/routes/notifications.routes.ts";
import type { RequestContext } from "../../../src/server/server-types.ts";
import { SignJWT } from "jose";

const JWT_SECRET = "integration-test-jwt-secret-long-enough";

async function token(payload: Record<string, unknown>): Promise<string> {
  return await new SignJWT(payload as never)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(JWT_SECRET));
}

function ctxFor(auth: string | null, path = "/notifications", body: unknown = null): RequestContext {
  return {
    method: "GET", path, headers: auth ? { authorization: auth } : {}, body, rawBody: null, jwt: auth,
  } as RequestContext;
}

function handlers(repo: InMemoryRepo): NotificationsHandlers {
  return {
    getHandler: new GetNotificationsHandler(repo),
    markReadHandler: new MarkReadHandler(repo),
    updatePrefsHandler: new UpdatePreferencesHandler(repo),
  };
}

test("S2 GET /notifications sin Authorization -> token_ausente (401-equiv)", async () => {
  vi.stubEnv("SUPABASE_JWT_SECRET", JWT_SECRET);
  const route = rutaGetNotifications(handlers(new InMemoryRepo()));
  const res = await route.handler(ctxFor(null));
  expect((res as { ok: boolean }).ok).toBe(false);
  expect((res as { error: { kind: string } }).error.kind).toBe("token_ausente");
  vi.unstubAllEnvs();
});

test("S2 GET /notifications JWT tenant A no ve datos ajenos (RLS)", async () => {
  vi.stubEnv("SUPABASE_JWT_SECRET", JWT_SECRET);
  const repo = new InMemoryRepo();
  repo.notifications.push({ id: "n_other", tenantId: "tenant_B", userId: "user_B", type: "message_received", severity: "info", title: "Ajeno", createdAt: "2025-01-01" });
  const t = await token({ sub: "user_A", tenant_id: "tenant_A" });
  const route = rutaGetNotifications(handlers(repo));
  const res = await route.handler(ctxFor(`Bearer ${t}`));
  expect(res.ok).toBe(true);
  const data = (res as { data: Array<{ id: string }> }).data;
  expect(data.find(n => n.id === "n_other")).toBeUndefined();
  vi.unstubAllEnvs();
});

test("S2 POST /notifications/:id/read con JWT valido -> marca leida", async () => {
  vi.stubEnv("SUPABASE_JWT_SECRET", JWT_SECRET);
  const repo = new InMemoryRepo();
  repo.notifications.push({ id: "n_r", tenantId: "tenant_A", userId: "user_A", type: "message_received", severity: "info", title: "Leer", createdAt: "2025-01-01" });
  const t = await token({ sub: "user_A", tenant_id: "tenant_A" });
  const route = rutaMarkRead(handlers(repo));
  const res = await route.handler(ctxFor(`Bearer ${t}`, "/notifications/n_r/read"));
  expect(res.ok).toBe(true);
  expect(repo.notifications[0].readAt).toBeTruthy();
  vi.unstubAllEnvs();
});