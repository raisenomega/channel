/**
 * HUB by Raisen — GetNotificationsHandler: lista notificaciones del usuario con filtros.
 * C4 ≤75 lineas.
 */
import { Result, err, ok } from "../../shared/domain/result.ts";
import type { Notification } from "../domain/notification.entity.ts";
import type { NotificationRepository, NotificationQuery } from "./notification.repo.ts";

export interface GetNotificationsCommand {
  readonly userId: string;
  readonly unread?: boolean;
  readonly since?: string;
  readonly limit?: number;
}

export type GetNotificationsError =
  | { readonly kind: "usuario_requerido" }
  | { readonly kind: "persistence_failure"; readonly cause: string };

export class GetNotificationsHandler {
  constructor(private readonly repo: NotificationRepository) {}

  async ejecutar(cmd: GetNotificationsCommand): Promise<Result<Notification[], GetNotificationsError>> {
    if (!cmd.userId || !cmd.userId.trim()) return err({ kind: "usuario_requerido" });

    const query: NotificationQuery = {
      ...(cmd.unread !== undefined ? { unread: cmd.unread } : {}),
      ...(cmd.since !== undefined ? { since: cmd.since } : {}),
      limit: cmd.limit ?? 20,
    };
    const result = await this.repo.listar(cmd.userId, query);
    if (!result.ok) return err({ kind: "persistence_failure", cause: result.error });
    return ok(result.value);
  }
}