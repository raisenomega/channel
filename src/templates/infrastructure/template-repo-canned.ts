import { Result, err, ok } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import { CannedResponseState } from "../domain/template.entity.ts";
import { CannedResponseRepository, RepoError } from "../domain/template.repository.ts";
import { desdeRowCanned } from "./template-repo-mappers.ts";

export class CannedResponseRepositorySupabase implements CannedResponseRepository {
  async guardar(response: CannedResponseState): Promise<Result<void, RepoError>> {
    try {
      const { error } = await supabase.from("canned_responses").upsert({
        id: response.id,
        tenant_id: response.tenantId,
        shortcode: response.shortcode,
        content: response.content,
        category: response.category,
      }, { onConflict: "id" });
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(undefined);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async buscar(tenantId: TenantId): Promise<Result<CannedResponseState[], RepoError>> {
    try {
      const { data, error } = await supabase.from("canned_responses")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("shortcode");
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok((data ?? []).map((r: Record<string, unknown>) => desdeRowCanned(r)));
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async buscarPorShortcode(tenantId: TenantId, shortcode: string): Promise<Result<CannedResponseState | null, RepoError>> {
    try {
      const { data, error } = await supabase.from("canned_responses")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("shortcode", shortcode)
        .single();
      if (error?.code === "PGRST116") return ok(null);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(data ? desdeRowCanned(data as Record<string, unknown>) : null);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async eliminar(id: string): Promise<Result<void, RepoError>> {
    try {
      const { error } = await supabase.from("canned_responses").delete().eq("id", id);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(undefined);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }
}