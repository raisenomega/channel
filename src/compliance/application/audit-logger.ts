import { Result } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";
import { AuditEntry } from "../domain/compliance.entity.ts";
import { AuditRepository, AuditQuery, RepoError, TenantDataPort } from "../domain/compliance.repository.ts";

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
  constructor(private readonly dataPort: TenantDataPort) {}

  async exportarDatos(tenantId: TenantId, tables: readonly string[]): Promise<Result<Record<string, unknown>[], string>> {
    const r = await this.dataPort.exportar(tenantId, tables);
    return r.ok ? r : { ok: false, error: r.error.kind === "persistence_failure" ? r.error.cause : r.error.kind };
  }
}

export class DataCleanupService {
  private static readonly TABLAS: readonly string[] = [
    "messages", "conversations", "contacts", "contact_channels", "contact_notes",
    "agent_interactions", "agent_knowledge", "agent_episodes", "agent_graph_memory",
    "quotes", "quote_line_items", "orders", "order_line_items", "payments",
    "automation_rule_executions", "consent_log",
  ];

  constructor(private readonly dataPort: TenantDataPort) {}

  async borradoSeguro(tenantId: TenantId): Promise<Result<void, string>> {
    const r = await this.dataPort.borrarDatos(tenantId, DataCleanupService.TABLAS);
    return r.ok ? r : { ok: false, error: r.error.kind === "persistence_failure" ? r.error.cause : r.error.kind };
  }
}