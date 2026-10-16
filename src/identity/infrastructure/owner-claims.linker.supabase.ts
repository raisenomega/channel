/**
 * HUB by Raisen — OwnerClaimsLinker via Supabase Auth Admin (Hotfix G).
 * Escribe app_metadata.tenant_id en auth.users con la service-role key.
 * Nunca loguea tokens ni claves. C4 <=75.
 */
import { Result, err, ok } from "../../shared/domain/result.ts";
import { TenantId, UserId } from "../../shared/domain/ids.ts";
import { OwnerClaimsLinker, RepoError } from "../domain/identity.repository.ts";
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

export class OwnerClaimsLinkerSupabase implements OwnerClaimsLinker {
  async vincular(userId: UserId, tenantId: TenantId): Promise<Result<void, RepoError>> {
    try {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        app_metadata: { tenant_id: tenantId },
      });
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(undefined);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }
}
