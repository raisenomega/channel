import { Result, err, ok } from "../../shared/domain/result.ts";
import { ContactId, TenantId } from "../../shared/domain/ids.ts";
import { ConsentRecord, ConsentAction, ChannelType, ConsentSource, AuditEntry } from "../domain/compliance.entity.ts";
import { ConsentRepository, AuditRepository, AuditQuery, RepoError, TenantDataPort } from "../domain/compliance.repository.ts";
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

export class AuditRepositorySupabase implements AuditRepository {
  async guardar(entry: AuditEntry): Promise<Result<void, RepoError>> {
    const { error } = await supabase.from("audit_logs").insert({
      tenant_id: entry.tenantId, actor_id: entry.actorId, actor_type: entry.actorType,
      action: entry.action, resource: entry.resource, resource_id: entry.resourceId,
      details: entry.details, created_at: entry.createdAt.toISOString(),
    });
    return error ? err({ kind: "persistence_failure", cause: error.message }) : ok(undefined);
  }

  async buscar(tenantId: TenantId, q: AuditQuery): Promise<Result<AuditEntry[], RepoError>> {
    let query = supabase.from("audit_logs").select("*").eq("tenant_id", tenantId);
    if (q.action) query = query.eq("action", q.action);
    if (q.resource) query = query.eq("resource", q.resource);
    if (q.actorId) query = query.eq("actor_id", q.actorId);
    if (q.from) query = query.gte("created_at", q.from.toISOString());
    if (q.to) query = query.lte("created_at", q.to.toISOString());
    if (q.limit) query = query.limit(q.limit);
    const { data, error } = await query;
    if (error) return err({ kind: "persistence_failure", cause: error.message });
    const rows: AuditEntry[] = (data ?? []).map((r) => Object.freeze({
      id: String(r.id), tenantId, actorId: r.actor_id ?? null,
      actorType: r.actor_type, action: r.action, resource: r.resource,
      resourceId: r.resource_id ?? null, details: r.details ?? {}, createdAt: new Date(r.created_at),
    }));
    return ok(rows);
  }
}

export class TenantDataPortSupabase implements TenantDataPort {
  async exportar(tenantId: TenantId, tablas: readonly string[]): Promise<Result<Record<string, unknown>[], RepoError>> {
    const out: Record<string, unknown>[] = [];
    for (const t of tablas) {
      const { data, error } = await supabase.from(t).select("*").eq("tenant_id", tenantId);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      out.push(...(data ?? []));
    }
    return ok(out);
  }

  async borrarDatos(tenantId: TenantId, tablas: readonly string[]): Promise<Result<void, RepoError>> {
    for (const t of tablas) {
      const { error } = await supabase.from(t).delete().eq("tenant_id", tenantId);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
    }
    return ok(undefined);
  }
}