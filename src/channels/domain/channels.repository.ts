import { Result } from "../../shared/domain/result.ts";
import { InboxId, TenantId } from "../../shared/domain/ids.ts";
import { InboxState } from "./inbox.entity.ts";

export interface InboxRepository {
  guardar(inbox: InboxState): Promise<Result<void, RepoError>>;
  buscar(id: InboxId): Promise<Result<InboxState | null, RepoError>>;
  buscarPorTenant(tenantId: TenantId): Promise<Result<InboxState[], RepoError>>;
  buscarPorCanal(tenantId: TenantId, channelType: string): Promise<Result<InboxState[], RepoError>>;
}

export type RepoError =
  | { readonly kind: "not_found" }
  | { readonly kind: "persistence_failure"; readonly cause: string };