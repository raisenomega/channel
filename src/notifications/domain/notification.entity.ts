/**
 * HUB by Raisen — Entidad de dominio: notificacion.
 * VOs: id, tenantId, userId, type, severity, payload.
 * C4 ≤75 lineas.
 */
import type { NotificationType, NotificationSeverity } from "./notification-type.vo.ts";

export interface Notification {
  readonly id: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly type: NotificationType;
  readonly severity: NotificationSeverity;
  readonly title: string;
  readonly body?: string;
  readonly payload?: Record<string, unknown>;
  readonly readAt?: string;
  readonly createdAt: string;
}