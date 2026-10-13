import { ContactId, TenantId } from "../../shared/domain/ids.ts";
import { ContactState } from "../domain/contact.entity.ts";
import { Email } from "../../shared/domain/email.vo.ts";
import { Phone } from "../../shared/domain/phone.vo.ts";

export const desdeRowContact = (row: Record<string, unknown>): ContactState => {
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
};