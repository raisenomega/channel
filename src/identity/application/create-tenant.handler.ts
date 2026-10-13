import { Result, err, ok } from "../../shared/domain/result.ts";
import { TenantState, TenantCreateError, crearTenant } from "../domain/tenant.entity.ts";
import { TenantRepository, RepoError } from "../domain/identity.repository.ts";
import { TenantPlan } from "../../shared/domain/types.ts";
import { TenantId } from "../../shared/domain/ids.ts";
import { Language } from "../../shared/domain/locale.vo.ts";

export interface CrearTenantCommand {
  readonly name: string;
  readonly slug: string;
  readonly plan: TenantPlan;
  readonly ownerEmail: string;
  readonly language?: Language;
}

export type CrearTenantError = TenantCreateError | RepoError | { readonly kind: "email_invalido" };

export class CrearTenantHandler {
  constructor(private readonly tenantRepo: TenantRepository) {}

  async ejecutar(cmd: CrearTenantCommand): Promise<Result<TenantId, CrearTenantError>> {
    const lang = cmd.language ?? "es";
    const tenantResult = crearTenant(cmd.name, cmd.slug, cmd.plan, lang);
    if (!tenantResult.ok) return err(tenantResult.error);
    const guardarResult = await this.tenantRepo.guardar(tenantResult.value);
    if (!guardarResult.ok) return err(guardarResult.error);
    return ok(tenantResult.value.id);
  }
}