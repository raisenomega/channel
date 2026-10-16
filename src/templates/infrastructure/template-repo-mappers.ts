import { TenantId } from "../../shared/domain/ids.ts";
import {
  WhatsAppTemplateState,
  CannedResponseState,
  TemplateStatus,
  WhatsAppButton,
} from "../domain/template.entity.ts";

/* ═══════════════ Mappers (row ↔ domain) ═══════════════ */

export const desdeRowWhatsApp = (row: Record<string, unknown>): WhatsAppTemplateState => {
  const buttonsRaw = (row.buttons as Record<string, unknown>[] | null) ?? null;

  let headerType = "none";
  let headerContent: string | null = null;
  const rawHt = row.header_type as string | undefined;
  if (typeof rawHt === "string" && rawHt && rawHt !== "none") {
    headerType = rawHt;
    headerContent = (row.header_content as string) ?? null;
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
    status: fromSqlStatus(row.status as string),
    metaTemplateId: (row.zernio_template_id as string) ?? null,
    rejectionReason: (row.rejection_reason as string) ?? null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  });
};

/** Mapea el status SQL del brief (§3) al vocabulario del domain. */
export const fromSqlStatus = (s: string): TemplateStatus => {
  switch (s) {
    case "pending_create":
    case "pending_meta": return "pending";
    case "approved": return "approved";
    case "rejected": return "rejected";
    case "paused": return "paused";
    case "disabled": return "disabled";
    case "error": return "rejected";
    default: return "draft";
  }
};

/** Mapea el status del domain al status SQL del brief (§3). */
export const toSqlStatus = (s: TemplateStatus): string => {
  switch (s) {
    case "draft": return "pending_create";
    case "pending": return "pending_meta";
    case "approved": return "approved";
    case "rejected": return "rejected";
    case "paused": return "paused";
    case "disabled": return "disabled";
    default: return "pending_create";
  }
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