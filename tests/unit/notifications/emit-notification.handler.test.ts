import { expect, test } from "vitest";
import { EmitNotificationHandler } from "../../../src/notifications/application/emit-notification.handler.ts";
import type { NotificationRepository } from "../../../src/notifications/application/notification.repo.ts";
import type { NotificationEmitter } from "../../../src/notifications/application/notification-emitter.port.ts";
import type { Notification } from "../../../src/notifications/domain/notification.entity.ts";
import type { NotificationPreference } from "../../../src/notifications/domain/notification-preference.entity.ts";
import type { NotificationType } from "../../../src/notifications/domain/notification-type.vo.ts";
import { ok, err } from "../../../src/shared/domain/result.ts";
import type { Result } from "../../../../src/shared/domain/result.ts";

class MockRepo implements NotificationRepository {
  generated: Notification[] = [];
  emitFail = false;
  muted = false;
  async guardar(n: Notification): Promise<Result<void, string>> { this.generated.push(n); return ok(undefined); }
  async listar(_u: string, _q: unknown): Promise<Result<Notification[], string>> { return ok([]); }
  async marcarLeida(_i: string, _u: string): Promise<Result<void, string>> { return ok(undefined); }
  async obtenerPreferencia(_u: string): Promise<Result<NotificationPreference | null, string>> { return ok(null); }
  async upsertPreferencia(_p: never): Promise<Result<void, string>> { return ok(undefined); }
  async esTipoSilenciado(_u: string, _t: NotificationType): Promise<Result<boolean, string>> { return ok(this.muted); }
}

class MockEmitter implements NotificationEmitter {
  emitCalls = 0;
  fail = false;
  async emitir(_n: Notification, _t: string): Promise<Result<void, string>> {
    this.emitCalls++;
    return this.fail ? err("realtime_down") : ok(undefined);
  }
}

test("emitir persiste y emite", async () => {
  const repo = new MockRepo();
  const emitter = new MockEmitter();
  const handler = new EmitNotificationHandler(repo, emitter);
  const result = await handler.ejecutar({ tenantId: "t_1", userId: "u_1", type: "signup_completed", title: "Listo" });
  expect(result.ok).toBe(true);
  expect(repo.generated.length).toBe(1);
  expect(emitter.emitCalls).toBe(1);
});

test("adversarial 4: emitter falla no rompe caller (best-effort)", async () => {
  const repo = new MockRepo();
  const emitter = new MockEmitter();
  emitter.fail = true;
  const handler = new EmitNotificationHandler(repo, emitter);
  const result = await handler.ejecutar({ tenantId: "t_1", userId: "u_1", type: "message_received", title: "Mensaje" });
  expect(result.ok).toBe(true); // sigue ok aunque emitter falle
  expect(repo.generated.length).toBe(1); // persistido
});

test("adversarial 3: muted type no persiste", async () => {
  const repo = new MockRepo();
  repo.muted = true;
  const emitter = new MockEmitter();
  const handler = new EmitNotificationHandler(repo, emitter);
  const result = await handler.ejecutar({ tenantId: "t_1", userId: "u_1", type: "signup_completed", title: "Listo" });
  expect(result.ok).toBe(false);
  expect(repo.generated.length).toBe(0); // no se persistio
});