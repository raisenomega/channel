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
  /** Hotfix G: enlaza un users.id existente sin tenant con su primer tenant como owner. */
  vincularTenant(userId: UserId, tenantId: TenantId): Promise<Result<void, RepoError>>;
}

/**
 * Hotfix G: escribe app_metadata.tenant_id en auth.users para que el PROXIMO JWT del
 * usuario traiga el claim que requireTenantAuth exige. Sin esto el onboarding muere tras crear.
 */
export interface OwnerClaimsLinker {
  vincular(userId: UserId, tenantId: TenantId): Promise<Result<void, RepoError>>;
}

export type RepoError =
  | { readonly kind: "not_found" }
  | { readonly kind: "duplicado"; readonly campo: string }
  | { readonly kind: "persistence_failure"; readonly cause: string };
