import { Result, err, ok } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";
import {
  IntegracionRepository,
  IntegrationConfigState,
  IntegrationType,
  RepoError,
  SyncLogState,
} from "../domain/integration.entity.ts";
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

interface ConfigRow {
  readonly id: string;
  readonly tenant_id: string;
  readonly type: string;
  readonly config: Record<string, unknown>;
  readonly is_active: boolean;
  readonly last_sync_at: string | null;
}

/** Repositorio Supabase real de la BC integraciones (tabla integration_configs). */
export class IntegrationRepositorySupabase implements IntegracionRepository {
  async guardar(sync: SyncLogState): Promise<Result<void, RepoError>> {
    try {
      const { error } = await supabase.from("integration_sync_logs").insert({
        tenant_id: sync.tenantId,
        integration_id: sync.integrationId,
        direction: sync.direction,
        entity: sync.entity,
        status: sync.status,
        error_message: sync.errorMessage,
      });
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(undefined);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async obtenerConfig(
    tenantId: TenantId,
    type: IntegrationType,
  ): Promise<Result<IntegrationConfigState | null, RepoError>> {
    try {
      const { data, error } = await supabase
        .from("integration_configs")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("type", type)
        .maybeSingle();
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      if (!data) return ok(null);
      const row = data as ConfigRow;
      return ok({
        id: row.id,
        tenantId,
        type: row.type as IntegrationType,
        config: Object.freeze({ ...row.config }),
        isActive: Boolean(row.is_active),
        lastSyncAt: row.last_sync_at ? new Date(row.last_sync_at) : null,
      });
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }
}
