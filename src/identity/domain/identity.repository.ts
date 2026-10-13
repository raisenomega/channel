import { Result } from "../../shared/domain/result.ts";
import { TenantId, UserId } from "../../shared/domain/ids.ts";
import { TenantState } from "./tenant.entity.ts";
import { UserState } from "./user.entity.ts";

export interface TenantRepository {
  guardar(tenant: TenantState): Promise<Result<void, RepoError>>;
  buscar(id: TenantId): Promise<Result<TenantState | null, RepoError>>;
  buscarPorSlug(slug: string): Promise<Result<TenantState | null, RepoError>>;
}

export interface UserRepository {
  guardar(user: UserState): Promise<Result<void, RepoError>>;
  buscar(id: UserId): Promise<Result<UserState | null, RepoError>>;
  buscarPorTenant(tenantId: TenantId): Promise<Result<UserState[], RepoError>>;
  buscarPorEmail(email: string): Promise<Result<UserState | null, RepoError>>;
}

export type RepoError =
  | { readonly kind: "not_found" }
  | { readonly kind: "duplicado"; readonly campo: string }
  | { readonly kind: "persistence_failure"; readonly cause: string };