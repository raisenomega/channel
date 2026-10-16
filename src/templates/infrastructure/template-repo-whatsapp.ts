import { Result, err, ok } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import { WhatsAppTemplateState, TemplateStatus } from "../domain/template.entity.ts";
import { WhatsAppTemplateRepository, RepoError } from "../domain/template.repository.ts";
import { desdeRowWhatsApp, toSqlStatus } from "./template-repo-mappers.ts";

export class WhatsAppTemplateRepositorySupabase implements WhatsAppTemplateRepository {
  async guardar(template: WhatsAppTemplateState): Promise<Result<void, RepoError>> {
    try {
      const { error } = await supabase.from("whatsapp_templates").upsert({
        id: template.id, tenant_id: template.tenantId, name: template.name, language: template.language,
        category: template.category, header_type: template.header.type, header_content: template.header.content,
        footer: template.footer, buttons: JSON.parse(JSON.stringify(template.buttons)), body: template.body,
        status: toSqlStatus(template.status), zernio_template_id: template.metaTemplateId,
        rejection_reason: template.rejectionReason, updated_at: template.updatedAt.toISOString(),
      }, { onConflict: "id" });
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(undefined);
    } catch (e) { return err({ kind: "persistence_failure", cause: String(e) }); }
  }

  async buscar(id: string): Promise<Result<WhatsAppTemplateState | null, RepoError>> {
    try {
      const { data, error } = await supabase.from("whatsapp_templates").select("*").eq("id", id).single();
      if (error?.code === "PGRST116") return ok(null);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(data ? desdeRowWhatsApp(data as Record<string, unknown>) : null);
    } catch (e) { return err({ kind: "persistence_failure", cause: String(e) }); }
  }

  async buscarPorTenant(tenantId: TenantId): Promise<Result<WhatsAppTemplateState[], RepoError>> {
    try {
      const { data, error } = await supabase.from("whatsapp_templates").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false });
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok((data ?? []).map((r: Record<string, unknown>) => desdeRowWhatsApp(r)));
    } catch (e) { return err({ kind: "persistence_failure", cause: String(e) }); }
  }

  async buscarPorMetaId(metaTemplateId: string): Promise<Result<WhatsAppTemplateState | null, RepoError>> {
    try {
      const { data, error } = await supabase.from("whatsapp_templates").select("*").eq("zernio_template_id", metaTemplateId).single();
      if (error?.code === "PGRST116") return ok(null);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(data ? desdeRowWhatsApp(data as Record<string, unknown>) : null);
    } catch (e) { return err({ kind: "persistence_failure", cause: String(e) }); }
  }

  async buscarPorNombre(nombre: string, language?: string): Promise<Result<WhatsAppTemplateState[], RepoError>> {
    try {
      let q = supabase.from("whatsapp_templates").select("*").eq("name", nombre);
      if (language) q = q.eq("language", language);
      const { data, error } = await q;
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok((data ?? []).map((r: Record<string, unknown>) => desdeRowWhatsApp(r)));
    } catch (e) { return err({ kind: "persistence_failure", cause: String(e) }); }
  }

  async actualizarStatus(id: string, status: TemplateStatus, rejectionReason?: string): Promise<Result<void, RepoError>> {
    try {
      const upd: Record<string, unknown> = { status: toSqlStatus(status), updated_at: new Date().toISOString() };
      if (rejectionReason !== undefined) upd.rejection_reason = rejectionReason;
      const { error } = await supabase.from("whatsapp_templates").update(upd).eq("id", id);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(undefined);
    } catch (e) { return err({ kind: "persistence_failure", cause: String(e) }); }
  }
}