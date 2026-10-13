import { Result, err, ok } from "../../shared/domain/result.ts";
import { ContactState } from "../domain/contact.entity.ts";
import { ContactRepository, RepoError } from "../domain/contact.repository.ts";
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import { ContactId, TenantId } from "../../shared/domain/ids.ts";
import { desdeRowContact } from "./contact.mapper.ts";

export class ContactRepositorySupabase implements ContactRepository {
  async guardar(contact: ContactState): Promise<Result<void, RepoError>> {
    try {
      const { error } = await supabase.from("contacts").upsert({
        id: contact.id, tenant_id: contact.tenantId,
        display_name: contact.displayName,
        primary_email: contact.primaryEmail?.valor,
        primary_phone: contact.primaryPhone?.valor,
        language: contact.language, segment: contact.segment,
        ltv_usd: contact.ltvUsd, total_orders: contact.totalOrders,
        marketing_opt_in: contact.marketingOptIn,
        do_not_contact: contact.doNotContact,
      }, { onConflict: "id" });
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(undefined);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async buscar(id: ContactId): Promise<Result<ContactState | null, RepoError>> {
    try {
      const { data, error } = await supabase.from("contacts").select("*").eq("id", id).single();
      if (error?.code === "PGRST116") return ok(null);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(data ? desdeRowContact(data) : null);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async buscarPorTenant(tenantId: TenantId): Promise<Result<ContactState[], RepoError>> {
    try {
      const { data, error } = await supabase.from("contacts").select("*").eq("tenant_id", tenantId);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok((data ?? []).map((r: Record<string, unknown>) => desdeRowContact(r)));
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async buscarPorEmail(tenantId: TenantId, email: string): Promise<Result<ContactState | null, RepoError>> {
    try {
      const { data, error } = await supabase.from("contacts").select("*")
        .eq("tenant_id", tenantId).eq("primary_email", email).single();
      if (error?.code === "PGRST116") return ok(null);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(data ? desdeRowContact(data) : null);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async buscarFuzzy(tenantId: TenantId, query: string): Promise<Result<ContactState[], RepoError>> {
    try {
      const { data, error } = await supabase.from("contacts").select("*")
        .eq("tenant_id", tenantId)
        .textSearch("display_name", query, { type: "websearch", config: "spanish" })
        .limit(20);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok((data ?? []).map((r: Record<string, unknown>) => desdeRowContact(r)));
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }
}