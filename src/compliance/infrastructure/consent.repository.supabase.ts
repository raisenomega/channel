import { Result, err, ok } from "../../shared/domain/result.ts";
import { ContactId, TenantId } from "../../shared/domain/ids.ts";
import { ConsentRecord, ConsentAction, ChannelType, ConsentSource } from "../domain/compliance.entity.ts";
import { ConsentRepository, RepoError } from "../domain/compliance.repository.ts";
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

export class ConsentRepositorySupabase implements ConsentRepository {
  async guardar(record: ConsentRecord): Promise<Result<void, RepoError>> {
    const { error } = await supabase.from("consent_log").insert({
      id: record.id, tenant_id: record.tenantId, contact_id: record.contactId,
      channel: record.channel, action: record.action, source: record.source,
      consented_at: record.consentedAt.toISOString(),
      expires_at: record.expiresAt?.toISOString() ?? null,
    });
    return error ? err({ kind: "persistence_failure", cause: error.message }) : ok(undefined);
  }

  async buscarUltimo(tenantId: TenantId, contactId: ContactId, channel: ChannelType): Promise<Result<ConsentRecord | null, RepoError>> {
    const { data, error } = await supabase.from("consent_log")
      .select("id,tenant_id,contact_id,channel,action,source,consented_at,expires_at")
      .eq("tenant_id", tenantId).eq("contact_id", contactId).eq("channel", channel)
      .order("consented_at", { ascending: false }).limit(1);
    if (error) return err({ kind: "persistence_failure", cause: error.message });
    const row = data?.[0];
    if (!row) return ok(null);
    return ok(Object.freeze({
      id: String(row.id), tenantId, contactId,
      channel: row.channel as ChannelType,
      action: row.action as ConsentAction,
      source: row.source as ConsentSource,
      consentedAt: new Date(row.consented_at),
      expiresAt: row.expires_at ? new Date(row.expires_at) : null,
    }));
  }
}