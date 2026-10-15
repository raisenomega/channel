/**
 * HUB by Raisen — Puerto para el emitter de notificaciones.
 * En Slice 3 solo Realtime; email/push quedan como extensión futura.
 * C4 ≤30 lineas.
 */
import type { Result } from "../../shared/domain/result.ts";
import type { Notification } from "../domain/notification.entity.ts";

export interface NotificationEmitter {
  emitir(notification: Notification, tenantId: string): Promise<Result<void, string>>;
}