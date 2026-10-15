/**
 * HUB by Raisen — Entidad de dominio: preferencias de notificacion por usuario.
 * Canales: inApp, email, push. Muted types por tipo.
 * C4 ≤75 lineas.
 */
import type { NotificationType } from "./notification-type.vo.ts";

export interface NotificationPreference {
  readonly id: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly inAppEnabled: boolean;
  readonly emailEnabled: boolean;
  readonly pushEnabled: boolean;
  readonly mutedTypes: readonly NotificationType[];
  readonly updatedAt: string;
}

export function estaSilenciado(pref: NotificationPreference | null, type: NotificationType): boolean {
  if (!pref) return false;
  return pref.mutedTypes.includes(type);
}