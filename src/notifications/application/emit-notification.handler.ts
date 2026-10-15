/**
 * HUB by Raisen — EmitNotificationHandler: construye Notification, persiste, emite via Realtime.
 * Best-effort: si el emitter falla, no rompe al caller (pag 5.5).
 * C4 ≤75 lineas.
 */
import { Result, err, ok } from "../../shared/domain/result.ts";
import type { Notification } from "../domain/notification.entity.ts";
import type { NotificationType, NotificationSeverity } from "../domain/notification-type.vo.ts";
import type { NotificationRepository } from "./notification.repo.ts";
import type { NotificationEmitter } from "./notification-emitter.port.ts";

export interface EmitNotificationCommand {
  readonly tenantId: string;
  readonly userId: string;
  readonly type: NotificationType;
  readonly severity?: NotificationSeverity;
  readonly title: string;
  readonly body?: string;
  readonly payload?: Record<string, unknown>;
}

export type EmitNotificationError =
  | { readonly kind: "persistence_failure"; readonly cause: string };

export class EmitNotificationHandler {
  constructor(
    private readonly repo: NotificationRepository,
    private readonly emitter: NotificationEmitter,
  ) {}

  async ejecutar(cmd: EmitNotificationCommand): Promise<Result<Notification, EmitNotificationError>> {
    // Respetar muted_types: no persistir si el usuario silenció el tipo
    const silenciado = await this.repo.esTipoSilenciado(cmd.userId, cmd.type);
    if (silenciado.ok && silenciado.value) return err({ kind: "persistence_failure", cause: "tipo_silenciado" });

    const notification: Notification = {
      id: crypto.randomUUID(),
      tenantId: cmd.tenantId,
      userId: cmd.userId,
      type: cmd.type,
      severity: cmd.severity ?? "info",
      title: cmd.title,
      ...(cmd.body ? { body: cmd.body } : {}),
      ...(cmd.payload ? { payload: cmd.payload } : {}),
      createdAt: new Date().toISOString(),
    };

    // Persistir — si falla, propagar
    const persist = await this.repo.guardar(notification);
    if (!persist.ok) return err({ kind: "persistence_failure", cause: persist.error });

    // Emitir via Realtime — BEST-EFFORT: si falla, seguir ok
    await this.emitter.emitir(notification, cmd.tenantId);

    return ok(notification);
  }
}