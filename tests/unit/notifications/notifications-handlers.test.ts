import { expect, test } from "vitest";
import { GetNotificationsHandler } from "../../../src/notifications/application/get-notifications.handler.ts";
import { MarkReadHandler } from "../../../src/notifications/application/mark-read.handler.ts";
import { UpdatePreferencesHandler } from "../../../src/notifications/application/update-preferences.handler.ts";
import type { Notification } from "../../../src/notifications/domain/notification.entity.ts";
import { ok, err } from "../../../src/shared/domain/result.ts";
import type { Result } from "../../../../src/shared/domain/result.ts";

class MockRepo {
  listed: Notification[] = [];
  markedRead: string[] = [];
  upserted: Array<{ userId: string; tenantId: string }> = [];
  upsertDeny = false;

  async listar(userId: string): Promise<Result<Notification[], string>> {
    return this.listed.length > 0 && userId === "u_1" ? ok(this.listed) : ok([]);
  }
  async marcarLeida(id: string, userId: string): Promise<Result<void, string>> {
    this.markedRead.push(`${id}:${userId}`);
    return ok(undefined);
  }
  async upsertPreferencia(pref: { userId: string; tenantId: string }): Promise<Result<void, string>> {
    if (this.upsertDeny && pref.userId !== "u_1") return err("denegado");
    this.upserted.push(pref);
    return ok(undefined);
  }
}

test("get-notifications lista del usuario", async () => {
  const repo = new MockRepo();
  repo.listed = [{ id: "n_1", tenantId: "t", userId: "u_1", type: "message_received", severity: "info", title: "Hola", createdAt: "2025-01-01" }];
  const handler = new GetNotificationsHandler(repo as never);
  const result = await handler.ejecutar({ userId: "u_1" });
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.value.length).toBe(1);
});

test("get-notifications sin userId retorna error", async () => {
  const repo = new MockRepo();
  const handler = new GetNotificationsHandler(repo as never);
  const result = await handler.ejecutar({ userId: "" });
  expect(result.ok).toBe(false);
});

test("mark-read invoca repo", async () => {
  const repo = new MockRepo();
  const handler = new MarkReadHandler(repo as never);
  const result = await handler.ejecutar({ id: "n_1", userId: "u_1" });
  expect(result.ok).toBe(true);
  expect(repo.markedRead).toContain("n_1:u_1");
});

test("adversarial 5: update-pref propaga denegacion de repo (permisos)", async () => {
  const repo = new MockRepo();
  repo.upsertDeny = true;
  const handler = new UpdatePreferencesHandler(repo as never);
  // Si un request trata de modificar prefs de otro usuario, el repo lo deniega y el handler lo propaga
  const result = await handler.ejecutar({ userId: "u_malicioso", tenantId: "t_1" });
  expect(result.ok).toBe(false); // el error del repo (denegado por permisos) se propaga
});