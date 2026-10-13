import { Result } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";
import { AutomationRuleState } from "./automation.entity.ts";
import { SLAPolicyState, BusinessHoursState, CannedResponseState } from "./sla-bizhours.entity.ts";

export interface AutomationRuleRepository {
  guardar(rule: AutomationRuleState): Promise<Result<void, RepoError>>;
  buscarActivas(tenantId: TenantId, trigger: string): Promise<Result<AutomationRuleState[], RepoError>>;
}

export interface SLAPolicyRepository {
  guardar(policy: SLAPolicyState): Promise<Result<void, RepoError>>;
  buscarActivas(tenantId: TenantId): Promise<Result<SLAPolicyState[], RepoError>>;
}

export interface BusinessHoursRepository {
  guardar(hours: BusinessHoursState): Promise<Result<void, RepoError>>;
  buscar(tenantId: TenantId): Promise<Result<BusinessHoursState[], RepoError>>;
}

export interface CannedResponseRepository {
  guardar(response: CannedResponseState): Promise<Result<void, RepoError>>;
  buscar(tenantId: TenantId): Promise<Result<CannedResponseState[], RepoError>>;
  buscarPorShortcode(tenantId: TenantId, shortcode: string): Promise<Result<CannedResponseState | null, RepoError>>;
}

export type RepoError =
  | { readonly kind: "not_found" }
  | { readonly kind: "persistence_failure"; readonly cause: string };