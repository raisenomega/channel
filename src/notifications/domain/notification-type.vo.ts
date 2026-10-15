/**
 * HUB by Raisen — Value Object: tipo de notificacion.
 * Union de tipos soportados. C4 ≤50 lineas.
 */
export type NotificationType =
  | "message_received"
  | "message_status_changed"
  | "signup_completed"
  | "custom";

export type NotificationSeverity = "info" | "warning" | "critical";