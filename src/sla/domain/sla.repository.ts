/**
 * HUB by Raisen — SLA: Puerto puerto (repository) para el agregado SLA.
 */
import { Result } from "../../shared/domain/result.ts";
import type { TenantId } from "../../shared/domain/ids.ts";
import type { ChannelType } from "../../shared/domain/types.ts";
import type { SLAPolicyState } from "./sla-policy.entity.ts";
import type { BusinessHoursState } from "./business-hours.entity.ts";

export interface SLAPolicyRepository {
  guardar(policy: SLAPolicyState): Promise<Result<void, RepoError>>;
  buscar(id: string): Promise<Result<SLAPolicyState | null, RepoError>>;
  buscarActivas(tenantId: TenantId): Promise<Result<SLAPolicyState[], RepoError>>;
  buscarPorCanal(tenantId: TenantId, channel: ChannelType): Promise<Result<SLAPolicyState[], RepoError>>;
  eliminar(id: string): Promise<Result<void, RepoError>>;
}

export interface BusinessHoursRepository {
  guardar(hours: BusinessHoursState): Promise<Result<void, RepoError>>;
  buscar(id: string): Promise<Result<BusinessHoursState | null, RepoError>>;
  buscarPorTenant(tenantId: TenantId): Promise<Result<BusinessHoursState[], RepoError>>;
  buscarPorDia(tenantId: TenantId, dayOfWeek: number): Promise<Result<BusinessHoursState[], RepoError>>;
  eliminar(id: string): Promise<Result<void, RepoError>>;
}

export type RepoError =
  | { readonly kind: "not_found" }
  | { readonly kind: "persistence_failure"; readonly cause: string };