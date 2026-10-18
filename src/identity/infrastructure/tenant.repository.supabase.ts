import { Result, err, ok } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";
import { TenantState } from "../../identity/domain/tenant.entity.ts";
import { TenantRepository, RepoError } from "../../identity/domain/identity.repository.ts";
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

export class TenantRepositorySupabase implements TenantRepository {
  async guardar(tenant: TenantState): Promise<Result<void, RepoError>> {
    try {
      const { error } = await supabase.from("tenants").insert({
        id: tenant.id, name: tenant.name, slug: tenant.slug,
        plan: tenant.plan, country_code: tenant.countryCode,
        timezone: tenant.timezone, default_language: tenant.language,
        phone: tenant.phone,
        features_enabled: tenant.featuresEnabled, status: tenant.status,
      });
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(undefined);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async buscar(id: TenantId): Promise<Result<TenantState | null, RepoError>> {
    try {
      const { data, error } = await supabase.from("tenants").select("*").eq("id", id).single();
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(data ? this.mapear(data) : null);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async buscarPorSlug(slug: string): Promise<Result<TenantState | null, RepoError>> {
    try {
      const { data, error } = await supabase.from("tenants").select("*").eq("slug", slug).single();
      if (error && error.code === "PGRST116") return ok(null);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(data ? this.mapear(data) : null);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  // O-6: persiste el profile Zernio del tenant (idempotente desde ensureProfileForTenant).
  async actualizarZernioProfileId(id: TenantId, zernioProfileId: string): Promise<Result<void, RepoError>> {
    try {
      const { error } = await supabase.from("tenants").update({ zernio_profile_id: zernioProfileId }).eq("id", id);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(undefined);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  private mapear(row: Record<string, unknown>): TenantState {
    return Object.freeze({
      id: row.id as TenantId,
      name: row.name as string,
      slug: row.slug as string,
      plan: row.plan as TenantState["plan"],
      countryCode: row.country_code as string,
      timezone: row.timezone as string,
      language: (row.default_language ?? "es") as "es" | "en",
      phone: (row.phone ?? null) as string | null,
      zernioProfileId: (row.zernio_profile_id ?? null) as string | null,
      featuresEnabled: Object.freeze(row.features_enabled as Record<string, unknown>),
      status: row.status as TenantState["status"],
      createdAt: new Date(row.created_at as string),
    });
  }
}