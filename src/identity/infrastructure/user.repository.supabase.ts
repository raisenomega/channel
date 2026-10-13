import { Result, err, ok } from "../../shared/domain/result.ts";
import { UserId, TenantId } from "../../shared/domain/ids.ts";
import { UserState } from "../../identity/domain/user.entity.ts";
import { UserRepository, RepoError } from "../../identity/domain/identity.repository.ts";
import { Email } from "../../shared/domain/email.vo.ts";

export class UserRepositorySupabase implements UserRepository {
  async guardar(user: UserState): Promise<Result<void, RepoError>> {
    try {
      const { error } = await supabase.from("users").insert({
        id: user.id, tenant_id: user.tenantId,
        email: user.email.valor, full_name: user.fullName,
        role: user.role, is_active: user.isActive,
      });
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(undefined);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async buscar(id: UserId): Promise<Result<UserState | null, RepoError>> {
    try {
      const { data, error } = await supabase.from("users").select("*").eq("id", id).single();
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(data ? this.mapear(data) : null);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async buscarPorTenant(tenantId: TenantId): Promise<Result<UserState[], RepoError>> {
    try {
      const { data, error } = await supabase.from("users").select("*").eq("tenant_id", tenantId);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok((data ?? []).map((r: Record<string, unknown>) => this.mapear(r)));
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async buscarPorEmail(email: string): Promise<Result<UserState | null, RepoError>> {
    const emailVO = Email.crear(email);
    if (!emailVO.ok) return ok(null);
    try {
      const { data, error } = await supabase.from("users").select("*").eq("email", emailVO.value.valor).single();
      if (error && error.code === "PGRST116") return ok(null);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(data ? this.mapear(data) : null);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  private mapear(row: Record<string, unknown>): UserState {
    const emailResult = Email.crear(row.email as string);
    return Object.freeze({
      id: row.id as UserId,
      tenantId: row.tenant_id as TenantId,
      email: emailResult.ok ? emailResult.value : (null as unknown as Email),
      fullName: row.full_name as string,
      role: row.role as UserState["role"],
      isActive: row.is_active as boolean,
      createdAt: new Date(row.created_at as string),
    });
  }
}

import { supabase } from "../../shared/infrastructure/supabase.client.ts";