import { Result, err, ok } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";
import { TenantDataPort, RepoError } from "../domain/compliance.repository.ts";
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

export class TenantDataPortSupabase implements TenantDataPort {
  async exportar(tenantId: TenantId, tablas: readonly string[]): Promise<Result<Record<string, unknown>[], RepoError>> {
    const out: Record<string, unknown>[] = [];
    for (const t of tablas) {
      const { data, error } = await supabase.from(t).select("*").eq("tenant_id", tenantId);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      out.push(...(data ?? []));
    }
    return ok(out);
  }

  async borrarDatos(tenantId: TenantId, tablas: readonly string[]): Promise<Result<void, RepoError>> {
    for (const t of tablas) {
      const { error } = await supabase.from(t).delete().eq("tenant_id", tenantId);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
    }
    return ok(undefined);
  }
}