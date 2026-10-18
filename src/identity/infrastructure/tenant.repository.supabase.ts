import { Result, err, ok } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";
import { TenantState } from "../../identity/domain/tenant.entity.ts";
import { TenantRepository, RepoError } from "../../identity/domain/identity.repository.ts";
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

export class TenantRepositorySupabase implements TenantRepository {
  // S-6: `extra` = columnas de perfil ya saneadas+mapeadas a snake_case por el route (opcional).
  async guardar(tenant: TenantState, extra: Record<string, unknown> = {}): Promise<Result<void, RepoError>> {
    try {
      const { error } = await supabase.from("tenants").insert({
        id: tenant.id, name: tenant.name, slug: tenant.slug, plan: tenant.plan,
        country_code: tenant.countryCode, timezone: tenant.timezone, default_language: tenant.language,
        phone: tenant.phone, features_enabled: tenant.featuresEnabled, status: tenant.status, ...extra,
      });
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(undefined);
    } catch (e) { return err({ kind: "persistence_failure", cause: String(e) }); }
  }

  async buscar(id: TenantId): Promise<Result<TenantState | null, RepoError>> {
    try {
      const { data, error } = await supabase.from("tenants").select("*").eq("id", id).single();
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(data ? this.mapear(data) : null);
    } catch (e) { return err({ kind: "persistence_failure", cause: String(e) }); }
  }

  async buscarPorSlug(slug: string): Promise<Result<TenantState | null, RepoError>> {
    try {
      const { data, error } = await supabase.from("tenants").select("*").eq("slug", slug).single();
      if (error && error.code === "PGRST116") return ok(null);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(data ? this.mapear(data) : null);
    } catch (e) { return err({ kind: "persistence_failure", cause: String(e) }); }
  }

  // UPDATE puntual de tenants (trigger trg_tenants_updated_at bumpea updated_at).
  private async actualizar(id: TenantId, patch: Record<string, unknown>): Promise<Result<void, RepoError>> {
    try {
      const { error } = await supabase.from("tenants").update(patch).eq("id", id);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(undefined);
    } catch (e) { return err({ kind: "persistence_failure", cause: String(e) }); }
  }

  // O-6: persiste el profile Zernio del tenant (idempotente desde ensureProfileForTenant).
  actualizarZernioProfileId(id: TenantId, zernioProfileId: string): Promise<Result<void, RepoError>> {
    return this.actualizar(id, { zernio_profile_id: zernioProfileId });
  }

  // R-3/R-4: edit-number. Solo phone (ya validado E.164 por el handler).
  actualizarTelefono(id: TenantId, phone: string): Promise<Result<void, RepoError>> {
    return this.actualizar(id, { phone });
  }

  // S-10: edit-datos. `columnas` ya saneadas+mapeadas a snake_case por el route (perfilAColumnas).
  actualizarPerfil(id: TenantId, columnas: Record<string, unknown>): Promise<Result<void, RepoError>> {
    return this.actualizar(id, columnas);
  }

  private mapear(row: Record<string, unknown>): TenantState {
    return Object.freeze({
      id: row.id as TenantId, name: row.name as string, slug: row.slug as string,
      plan: row.plan as TenantState["plan"], countryCode: row.country_code as string,
      timezone: row.timezone as string, language: (row.default_language ?? "es") as "es" | "en",
      phone: (row.phone ?? null) as string | null,
      zernioProfileId: (row.zernio_profile_id ?? null) as string | null,
      featuresEnabled: Object.freeze(row.features_enabled as Record<string, unknown>),
      status: row.status as TenantState["status"], createdAt: new Date(row.created_at as string),
    });
  }
}
