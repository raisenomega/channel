import { Result, err, ok } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";
import { AuditEntry, crearAuditEntry } from "../domain/compliance.entity.ts";
import { AuditRepository, AuditQuery, RepoError } from "../domain/compliance.repository.ts";

export class AuditLogger {
  constructor(private readonly auditRepo: AuditRepository) {}

  async log(entry: AuditEntry): Promise<Result<void, RepoError>> {
    return this.auditRepo.guardar(entry);
  }

  async buscar(tenantId: TenantId, query: AuditQuery): Promise<Result<AuditEntry[], RepoError>> {
    return this.auditRepo.buscar(tenantId, query);
  }
}

export class DataExportService {
  async exportarDatos(tenantId: TenantId, tables: string[]): Promise<Result<Record<string, unknown>[], string>> {
    try {
      const data: Record<string, unknown>[] = [];
      for (const table of tables) {
        const { data: rows, error } = await supabase.from(table).select("*").eq("tenant_id", tenantId);
        if (error) return err(error.message);
        data.push(...(rows ?? []));
      }
      return ok(data);
    } catch (e) {
      return err(String(e));
    }
  }
}

class DataCleanupService {
  async borradoSeguro(tenantId: TenantId): Promise<Result<void, string>> {
    const tables: string[] = [
      "messages", "conversations", "contacts", "contact_channels", "contact_notes",
      "agent_interactions", "agent_knowledge", "agent_episodes", "agent_graph_memory",
      "quotes", "quote_line_items", "orders", "order_line_items", "payments",
      "automation_rule_executions", "consent_log",
    ];
    try {
      for (const table of tables) {
        const { error } = await supabase.from(table).delete().eq("tenant_id", tenantId);
        if (error) return err(error.message);
      }
      return ok(undefined);
    } catch (e) {
      return err(String(e));
    }
  }
}

import { supabase } from "../../shared/infrastructure/supabase.client.ts";