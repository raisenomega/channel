/**
 * HUB by Raisen — Interfaz del repositorio de notificaciones.
 * C4 ≤50 lineas.
 */
import type { Result } from "../../shared/domain/result.ts";
import type { Notification } from "../domain/notification.entity.ts";
import type { NotificationPreference } from "../domain/notification-preference.entity.ts";
import type { NotificationType } from "../domain/notification-type.vo.ts";

export interface NotificationQuery {
  readonly unread?: boolean;
  readonly since?: string;
  readonly limit?: number;
}

export interface NotificationRepository {
  guardar(n: Notification): Promise<Result<void, string>>;
  listar(userId: string, q: NotificationQuery): Promise<Result<Notification[], string>>;
  marcarLeida(id: string, userId: string): Promise<Result<void, string>>;
  obtenerPreferencia(userId: string): Promise<Result<NotificationPreference | null, string>>;
  upsertPreferencia(pref: Pick<NotificationPreference, "userId" | "tenantId" | "inAppEnabled" | "emailEnabled" | "pushEnabled" | "mutedTypes">): Promise<Result<void, string>>;
  esTipoSilenciado(userId: string, type: NotificationType): Promise<Result<boolean, string>>;
}