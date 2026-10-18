/**
 * HUB by Raisen — Crear tenant (Hotfix G, decision D1: 1 tenant por usuario).
 * Flujo: users(ownerUserId) sin tenant -> crear tenant -> fila users rol owner (id = sub)
 * -> app_metadata.tenant_id (OwnerClaimsLinker) para que el proximo JWT traiga el claim.
 * 409 tenant_ya_existe si el usuario ya tiene tenant. C4 <=75.
 */
import { Result, err, ok } from "../../shared/domain/result.ts";
import { TenantCreateError, crearTenant } from "../domain/tenant.entity.ts";
import { UserCreateError, crearUser } from "../domain/user.entity.ts";
import { TenantRepository, UserRepository, OwnerClaimsLinker, RepoError } from "../domain/identity.repository.ts";
import { TenantPlan } from "../../shared/domain/types.ts";
import { TenantId, UserId } from "../../shared/domain/ids.ts";
import { Language } from "../../shared/domain/locale.vo.ts";
import { Email } from "../../shared/domain/email.vo.ts";

export interface CrearTenantCommand {
  readonly name: string;
  readonly slug: string;
  readonly plan: TenantPlan;
  readonly ownerEmail: string;
  readonly ownerUserId: string; // sub del JWT que crea el tenant (#17). Obligatorio.
  readonly language?: Language;
  readonly perfil?: Record<string, unknown>; // S-6: columnas de perfil saneadas (snake_case).
  readonly countryCode?: string;
  readonly timezone?: string;
  readonly phone?: string;
}

export type CrearTenantError = TenantCreateError | UserCreateError | RepoError
  | { readonly kind: "email_invalido" }
  | { readonly kind: "owner_requerido" }
  | { readonly kind: "tenant_ya_existe"; readonly tenantId: string }
  | { readonly kind: "owner_link_failed"; readonly cause: string };

export class CrearTenantHandler {
  constructor(
    private readonly tenantRepo: TenantRepository,
    private readonly userRepo: UserRepository,
    private readonly linker: OwnerClaimsLinker,
  ) {}

  async ejecutar(cmd: CrearTenantCommand): Promise<Result<TenantId, CrearTenantError>> {
    if (!cmd.ownerUserId) return err({ kind: "owner_requerido" });
    const ownerId = cmd.ownerUserId as UserId;
    const lang = cmd.language ?? "es";
    const existente = await this.userRepo.buscar(ownerId);
    if (!existente.ok) return err(existente.error);
    if (existente.value?.tenantId) return err({ kind: "tenant_ya_existe", tenantId: String(existente.value.tenantId) });

    const email = Email.crear(cmd.ownerEmail);
    if (!email.ok) return err({ kind: "email_invalido" });

    const tenantResult = crearTenant(cmd.name, cmd.slug, cmd.plan, lang, cmd.countryCode, cmd.timezone, cmd.phone);
    if (!tenantResult.ok) return err(tenantResult.error);
    const tenant = tenantResult.value;

    const guardarTenant = await this.tenantRepo.guardar(tenant, cmd.perfil);
    if (!guardarTenant.ok) return err(guardarTenant.error);

    const enlace = existente.value
      ? await this.userRepo.vincularTenant(ownerId, tenant.id)
      : await this.guardarOwner(email.value, cmd.name, tenant.id, lang, ownerId);
    if (!enlace.ok) return err(enlace.error);

    const claims = await this.linker.vincular(ownerId, tenant.id);
    if (!claims.ok) return err({ kind: "owner_link_failed", cause: claims.error.kind });
    return ok(tenant.id);
  }

  private async guardarOwner(email: Email, name: string, tenantId: TenantId, lang: Language, id: UserId): Promise<Result<void, CrearTenantError>> {
    const owner = crearUser(email, name, "owner", tenantId, lang, id);
    if (!owner.ok) return err(owner.error);
    return this.userRepo.guardar(owner.value);
  }
}
