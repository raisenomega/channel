import { Result, err, ok } from "../../shared/domain/result.ts";
import { ContactState } from "../domain/contact.entity.ts";
import { ContactRepository, RepoError } from "../domain/contact.repository.ts";
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import { ContactId, TenantId } from "../../shared/domain/ids.ts";
import { Email } from "../../shared/domain/email.vo.ts";
import { Phone } from "../../shared/domain/phone.vo.ts";

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
      return ok(data ? this.desdeRow(data) : null);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async buscarPorTenant(tenantId: TenantId): Promise<Result<ContactState[], RepoError>> {
    try {
      const { data, error } = await supabase.from("contacts").select("*").eq("tenant_id", tenantId);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok((data ?? []).map((r) => this.desdeRow(r)));
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
      return ok(data ? this.desdeRow(data) : null);
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
      return ok((data ?? []).map((r) => this.desdeRow(r)));
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  private desdeRow(row: Record<string, unknown>): ContactState {
    const emailVO = row.primary_email ? Email.crear(row.primary_email as string) : null;
    const phoneVO = row.primary_phone ? Phone.crear(row.primary_phone as string) : null;
    return Object.freeze({
      id: row.id as ContactId,
      tenantId: row.tenant_id as TenantId,
      displayName: row.display_name as string,
      primaryEmail: emailVO?.ok ? emailVO.value : null,
      primaryPhone: phoneVO?.ok ? phoneVO.value : null,
      language: (row.language ?? "es") as never,
      segment: (row.segment ?? "new_lead") as never,
      ltvUsd: (row.ltv_usd as number) ?? 0,
      totalOrders: (row.total_orders as number) ?? 0,
      preferredChannel: null,
      doNotContact: (row.do_not_contact as boolean) ?? false,
      marketingOptIn: (row.marketing_opt_in as boolean) ?? false,
      aiContextSummary: row.ai_context_summary as string ?? null,
      createdAt: new Date(row.created_at as string),
    });
  }
}