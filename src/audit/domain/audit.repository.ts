import { Result } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";
import { AuditEntry } from "./audit-entry.entity.ts";

/** Filtros de búsqueda de entradas de auditoría. Todos opcionales. */
export interface AuditQuery {
  readonly actorId?: string;
  readonly actorType?: string;
  readonly action?: string;
  readonly resource?: string;
  readonly from?: Date;
  readonly to?: Date;
  readonly limit?: number;
  readonly cursor?: string;
}

export type RepoError =
  | { readonly kind: "not_found" }
  | { readonly kind: "persistence_failure"; readonly cause: string };

export interface AuditRepository {
  guardar(entry: AuditEntry): Promise<Result<void, RepoError>>;
  buscar(tenantId: TenantId, query: AuditQuery): Promise<Result<AuditEntry[], RepoError>>;
}