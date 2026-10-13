import { Result, err, ok } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import {
  WhatsAppTemplateState,
  CannedResponseState,
  TemplateStatus,
  WhatsAppButton,
} from "../domain/template.entity.ts";
import {
  WhatsAppTemplateRepository,
  CannedResponseRepository,
  RepoError,
} from "../domain/template.repository.ts";

/* ══════════════════════════════════════════
   Mappers (row ↔ domain)
   ══════════════════════════════════════════ */

const desdeRowWhatsApp = (row: Record<string, unknown>): WhatsAppTemplateState => {
  const headerRaw = row.header_json as Record<string, unknown> | null;
  const buttonsRaw = row.buttons_json as Record<string, unknown>[] | null;

  let headerType = "none";
  let headerContent: string | null = null;
  if (headerRaw && typeof headerRaw.type === "string") {
    headerType = headerRaw.type;
    headerContent = (headerRaw.content as string) ?? null;
  }

  return Object.freeze({
    id: row.id as string,
    tenantId: row.tenant_id as TenantId,
    name: row.name as string,
    language: row.language as string,
    category: row.category as "marketing" | "utility" | "authentication",
    header: Object.freeze({ type: headerType, content: headerContent } as never),
    body: row.body as string,
    footer: (row.footer as string) ?? null,
    buttons: Object.freeze((buttonsRaw ?? []).map((b) => Object.freeze(b) as unknown as WhatsAppButton)),
    status: row.status as TemplateStatus,
    metaTemplateId: (row.meta_template_id as string) ?? null,
    rejectionReason: (row.rejection_reason as string) ?? null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  });
};

const desdeRowCanned = (row: Record<string, unknown>): CannedResponseState => {
  return Object.freeze({
    id: row.id as string,
    tenantId: row.tenant_id as TenantId,
    shortcode: row.shortcode as string,
    content: row.content as string,
    category: (row.category as string) ?? "general",
  });
};

/* ══════════════════════════════════════════
   WhatsAppTemplateRepositorySupabase
   ══════════════════════════════════════════ */
export class WhatsAppTemplateRepositorySupabase implements WhatsAppTemplateRepository {
  async guardar(template: WhatsAppTemplateState): Promise<Result<void, RepoError>> {
    try {
      const { error } = await supabase.from("whatsapp_templates").upsert({
        id: template.id,
        tenant_id: template.tenantId,
        name: template.name,
        language: template.language,
        category: template.category,
        header_json: JSON.parse(JSON.stringify(template.header)),
        body: template.body,
        footer: template.footer,
        buttons_json: JSON.parse(JSON.stringify(template.buttons)),
        status: template.status,
        meta_template_id: template.metaTemplateId,
        rejection_reason: template.rejectionReason,
        updated_at: template.updatedAt.toISOString(),
      }, { onConflict: "id" });
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(undefined);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async buscar(id: string): Promise<Result<WhatsAppTemplateState | null, RepoError>> {
    try {
      const { data, error } = await supabase.from("whatsapp_templates").select("*").eq("id", id).single();
      if (error?.code === "PGRST116") return ok(null);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(data ? desdeRowWhatsApp(data as Record<string, unknown>) : null);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async buscarPorTenant(tenantId: TenantId): Promise<Result<WhatsAppTemplateState[], RepoError>> {
    try {
      const { data, error } = await supabase.from("whatsapp_templates")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok((data ?? []).map((r: Record<string, unknown>) => desdeRowWhatsApp(r)));
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async buscarPorMetaId(metaTemplateId: string): Promise<Result<WhatsAppTemplateState | null, RepoError>> {
    try {
      const { data, error } = await supabase.from("whatsapp_templates")
        .select("*")
        .eq("meta_template_id", metaTemplateId)
        .single();
      if (error?.code === "PGRST116") return ok(null);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(data ? desdeRowWhatsApp(data as Record<string, unknown>) : null);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async actualizarStatus(
    id: string,
    status: TemplateStatus,
    rejectionReason?: string,
  ): Promise<Result<void, RepoError>> {
    try {
      const updates: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (rejectionReason !== undefined) {
        updates.rejection_reason = rejectionReason;
      }
      const { error } = await supabase.from("whatsapp_templates").update(updates).eq("id", id);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(undefined);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }
}

/* ══════════════════════════════════════════
   CannedResponseRepositorySupabase
   ══════════════════════════════════════════ */
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

  async buscarPorShortcode(
    tenantId: TenantId,
    shortcode: string,
  ): Promise<Result<CannedResponseState | null, RepoError>> {
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