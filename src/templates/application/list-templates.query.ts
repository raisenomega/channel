/**
 * HUB by Raisen — Query: listar plantillas por tenant (Slide 4.9).
 * Solo repositorio local; syncFailed lo setea la ruta si Zernio timeout. C4 ≤75.
 */
import { Result, ok, err } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";
import { WhatsAppTemplateState } from "../domain/template.entity.ts";
import { WhatsAppTemplateRepository, RepoError } from "../domain/template.repository.ts";

export interface ListTemplatesResult {
  readonly templates: readonly WhatsAppTemplateState[];
  readonly syncFailed: boolean;
}

export type ListError = RepoError;

export class ListTemplatesQuery {
  constructor(private readonly repo: WhatsAppTemplateRepository) {}

  async ejecutar(tenantId: TenantId): Promise<Result<ListTemplatesResult, ListError>> {
    const r = await this.repo.buscarPorTenant(tenantId);
    if (!r.ok) return err(r.error);
    return ok({ templates: r.value, syncFailed: false });
  }
}