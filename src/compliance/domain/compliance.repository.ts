import { Result } from "../../shared/domain/result.ts";
import { ContactId, TenantId } from "../../shared/domain/ids.ts";
import { ConsentRecord, ChannelType, AuditEntry } from "../domain/compliance.entity.ts";

export interface ConsentRepository {
  guardar(record: ConsentRecord): Promise<Result<void, RepoError>>;
  buscarUltimo(tenantId: TenantId, contactId: ContactId, channel: ChannelType): Promise<Result<ConsentRecord | null, RepoError>>;
}

export interface AuditRepository {
  guardar(entry: AuditEntry): Promise<Result<void, RepoError>>;
  buscar(tenantId: TenantId, options: AuditQuery): Promise<Result<AuditEntry[], RepoError>>;
}

export interface AuditQuery {
  readonly action?: string;
  readonly resource?: string;
  readonly actorId?: string;
  readonly from?: Date;
  readonly to?: Date;
  readonly limit?: number;
}

export type RepoError =
  | { readonly kind: "not_found" }
  | { readonly kind: "persistence_failure"; readonly cause: string };

/** Puerta de acceso a los datos del tenant para exportacion/borrado seguro. */
export interface TenantDataPort {
  exportar(tenantId: TenantId, tablas: readonly string[]): Promise<Result<Record<string, unknown>[], RepoError>>;
  borrarDatos(tenantId: TenantId, tablas: readonly string[]): Promise<Result<void, RepoError>>;
}