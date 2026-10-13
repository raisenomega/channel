import { Result, err } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";
import { AuditEntry } from "../domain/audit-entry.entity.ts";
import { AuditRepository } from "../domain/audit.repository.ts";

export interface SearchAuditQuery {
  readonly actorId?: string;
  readonly actorType?: string;
  readonly action?: string;
  readonly resource?: string;
  readonly from?: Date;
  readonly to?: Date;
  readonly limit?: number;
  readonly cursor?: string;
}

export type SearchAuditError =
  | { readonly kind: "query_invalida" }
  | { readonly kind: "persistence_failure"; readonly cause: string };

/** Versión mutable de AuditQuery para construcción incremental bajo exactOptionalPropertyTypes. */
type MutableAuditQuery = {
  actorId?: string;
  actorType?: string;
  action?: string;
  resource?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  cursor?: string;
};

/** Guard de dominio para acotar resultados de búsqueda y evitar consultas abusivas. */
const LIMITE_MAXIMO = 500;

export class SearchAuditHandler {
  constructor(private readonly auditRepo: AuditRepository) {}

  async ejecutar(tenantId: TenantId, query: SearchAuditQuery): Promise<Result<AuditEntry[], SearchAuditError>> {
    if (query.limit !== undefined && query.limit <= 0) {
      return err({ kind: "query_invalida" });
    }
    if (query.from !== undefined && query.to !== undefined && query.from > query.to) {
      return err({ kind: "query_invalida" });
    }

    const limit = query.limit === undefined ? LIMITE_MAXIMO : Math.min(query.limit, LIMITE_MAXIMO);
    const dominio: MutableAuditQuery = { limit };
    if (query.actorId !== undefined) dominio.actorId = query.actorId;
    if (query.actorType !== undefined) dominio.actorType = query.actorType;
    if (query.action !== undefined) dominio.action = query.action;
    if (query.resource !== undefined) dominio.resource = query.resource;
    if (query.from !== undefined) dominio.from = query.from;
    if (query.to !== undefined) dominio.to = query.to;
    if (query.cursor !== undefined) dominio.cursor = query.cursor;

    const resultado = await this.auditRepo.buscar(tenantId, dominio);
    if (!resultado.ok) {
      const cause = "cause" in resultado.error ? resultado.error.cause : "fallo_persistencia";
      return err({ kind: "persistence_failure", cause });
    }

    return resultado;
  }
}