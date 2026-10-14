import { TenantId } from "../../shared/domain/ids.ts";
import {
  WhatsAppTemplateState,
  CannedResponseState,
  TemplateStatus,
  WhatsAppButton,
} from "../domain/template.entity.ts";

/* ═══════════════ Mappers (row ↔ domain) ═══════════════ */

export const desdeRowWhatsApp = (row: Record<string, unknown>): WhatsAppTemplateState => {
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

export const desdeRowCanned = (row: Record<string, unknown>): CannedResponseState => {
  return Object.freeze({
    id: row.id as string,
    tenantId: row.tenant_id as TenantId,
    shortcode: row.shortcode as string,
    content: row.content as string,
    category: (row.category as string) ?? "general",
  });
};