/**
 * HUB by Raisen — UpdatePreferencesHandler: actualiza preferencias de notificacion.
 * Upsert sobre (tenant_id, user_id). C4 ≤50 lineas.
 */
import { Result, err } from "../../shared/domain/result.ts";
import type { NotificationPreference } from "../domain/notification-preference.entity.ts";
import type { NotificationType } from "../domain/notification-type.vo.ts";

export interface UpdatePreferencesCommand {
  readonly userId: string;
  readonly tenantId: string;
  readonly inAppEnabled?: boolean;
  readonly emailEnabled?: boolean;
  readonly pushEnabled?: boolean;
  readonly mutedTypes?: readonly NotificationType[];
}

export class UpdatePreferencesHandler {
  constructor(private readonly repo: { upsertPreferencia(pref: Pick<NotificationPreference, "userId" | "tenantId" | "inAppEnabled" | "emailEnabled" | "pushEnabled" | "mutedTypes">): Promise<Result<void, string>> }) {}

  async ejecutar(cmd: UpdatePreferencesCommand): Promise<Result<void, string>> {
    if (!cmd.userId || !cmd.tenantId) return err("campos_requeridos");
    const pref = {
      userId: cmd.userId,
      tenantId: cmd.tenantId,
      inAppEnabled: cmd.inAppEnabled ?? true,
      emailEnabled: cmd.emailEnabled ?? false,
      pushEnabled: cmd.pushEnabled ?? false,
      mutedTypes: cmd.mutedTypes ?? [],
    };
    return this.repo.upsertPreferencia(pref);
  }
}