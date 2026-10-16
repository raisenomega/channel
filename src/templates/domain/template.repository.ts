import { Result } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";
import { WhatsAppTemplateState, CannedResponseState } from "./template.entity.ts";

/* ──────────────────────────────────────────
   WhatsAppTemplateRepository
   ────────────────────────────────────────── */
export interface WhatsAppTemplateRepository {
  guardar(template: WhatsAppTemplateState): Promise<Result<void, RepoError>>;
  buscar(id: string): Promise<Result<WhatsAppTemplateState | null, RepoError>>;
  buscarPorTenant(tenantId: TenantId): Promise<Result<WhatsAppTemplateState[], RepoError>>;
  buscarPorMetaId(metaTemplateId: string): Promise<Result<WhatsAppTemplateState | null, RepoError>>;
  buscarPorNombre(nombre: string, language?: string): Promise<Result<WhatsAppTemplateState[], RepoError>>;
  actualizarStatus(id: string, status: WhatsAppTemplateState["status"], rejectionReason?: string): Promise<Result<void, RepoError>>;
}

/* ──────────────────────────────────────────
   CannedResponseRepository (BC templates)
   ────────────────────────────────────────── */
export interface CannedResponseRepository {
  guardar(response: CannedResponseState): Promise<Result<void, RepoError>>;
  buscar(tenantId: TenantId): Promise<Result<CannedResponseState[], RepoError>>;
  buscarPorShortcode(tenantId: TenantId, shortcode: string): Promise<Result<CannedResponseState | null, RepoError>>;
  eliminar(id: string): Promise<Result<void, RepoError>>;
}

/* ──────────────────────────────────────────
   Error común de persistencia
   ────────────────────────────────────────── */
export type RepoError =
  | { readonly kind: "not_found" }
  | { readonly kind: "duplicado" }
  | { readonly kind: "persistence_failure"; readonly cause: string };