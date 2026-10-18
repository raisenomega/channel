/**
 * HUB by Raisen — O-6: ensureProfileForTenant (patron get_or_create_profile de OMEGA).
 * Idempotente: si el tenant ya tiene zernio_profile_id lo devuelve; si no, crea (o adopta
 * por 409) el profile en Zernio y lo persiste. Aislamiento multi-tenant del OAuth. C4 <=75.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";
import type { TenantId } from "../../shared/domain/ids.ts";
import type { TenantState } from "../../identity/domain/tenant.entity.ts";
import { createProfile } from "../infrastructure/zernio-connect.client.ts";

// Dependencia minima (ISP): no acopla toda la TenantRepository.
export interface TenantProfileStore {
  buscar(id: TenantId): Promise<Result<TenantState | null, { readonly kind: string }>>;
  actualizarZernioProfileId(id: TenantId, zernioProfileId: string): Promise<Result<void, { readonly kind: string }>>;
}

export type EnsureProfileError =
  | { readonly kind: "tenant_not_found" }
  | { readonly kind: "zernio_no_configurado" }
  | { readonly kind: "zernio_error"; readonly cause: string }
  | { readonly kind: "persistence_error" };

export class ZernioProfileService {
  constructor(private readonly store: TenantProfileStore, private readonly apiKey: string) {}

  async ensureProfileForTenant(tenantId: TenantId): Promise<Result<{ zernioProfileId: string }, EnsureProfileError>> {
    const t = await this.store.buscar(tenantId);
    if (!t.ok) return err({ kind: "persistence_error" });
    if (!t.value) return err({ kind: "tenant_not_found" });
    if (t.value.zernioProfileId) return ok({ zernioProfileId: t.value.zernioProfileId });

    const created = await createProfile(this.apiKey, t.value.slug);
    if (!created.ok) {
      return err(created.error.kind === "no_configurado" ? { kind: "zernio_no_configurado" } : { kind: "zernio_error", cause: created.error.kind });
    }
    const saved = await this.store.actualizarZernioProfileId(tenantId, created.value.profileId);
    if (!saved.ok) return err({ kind: "persistence_error" });
    return ok({ zernioProfileId: created.value.profileId });
  }
}
