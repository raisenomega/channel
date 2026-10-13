import { Result, err, ok } from "../../shared/domain/result.ts";
import { InboxId, TenantId } from "../../shared/domain/ids.ts";
import { InboxState } from "../../channels/domain/inbox.entity.ts";
import { InboxRepository, RepoError } from "../../channels/domain/channels.repository.ts";
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

export class InboxRepositorySupabase implements InboxRepository {
  async guardar(inbox: InboxState): Promise<Result<void, RepoError>> {
    try {
      const { error } = await supabase.from("inboxes").insert({
        id: inbox.id, tenant_id: inbox.tenantId,
        channel_type: inbox.channelType, provider: inbox.provider,
        name: inbox.name, is_active: inbox.isActive,
        is_primary_for_channel: inbox.isPrimaryForChannel,
        sync_status: inbox.syncStatus,
      });
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(undefined);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async buscar(id: InboxId): Promise<Result<InboxState | null, RepoError>> {
    try {
      const { data, error } = await supabase.from("inboxes").select("*").eq("id", id).single();
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(data ? this.mapear(data) : null);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async buscarPorTenant(tenantId: TenantId): Promise<Result<InboxState[], RepoError>> {
    try {
      const { data, error } = await supabase.from("inboxes").select("*").eq("tenant_id", tenantId);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok((data ?? []).map((r: Record<string, unknown>) => this.mapear(r)));
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async buscarPorCanal(tenantId: TenantId, channelType: string): Promise<Result<InboxState[], RepoError>> {
    try {
      const { data, error } = await supabase.from("inboxes").select("*")
        .eq("tenant_id", tenantId).eq("channel_type", channelType);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok((data ?? []).map((r: Record<string, unknown>) => this.mapear(r)));
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  private mapear(row: Record<string, unknown>): InboxState {
    return Object.freeze({
      id: row.id as InboxId,
      tenantId: row.tenant_id as TenantId,
      channelType: row.channel_type as InboxState["channelType"],
      provider: row.provider as InboxState["provider"],
      name: row.name as string,
      isActive: row.is_active as boolean,
      isPrimaryForChannel: row.is_primary_for_channel as boolean,
      syncStatus: row.sync_status as InboxState["syncStatus"],
      createdAt: new Date(row.created_at as string),
    });
  }
}