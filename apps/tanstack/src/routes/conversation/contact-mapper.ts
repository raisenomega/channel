/**
 * HUB by Raisen — Mapper de datos crudos → ficha 360 (Contact360).
 */
import type { Contact360 } from "@/lib/types";
import type { ContactRaw } from "./conversation-contact-data";

export function mapToContact360(c: ContactRaw): Contact360 {
  return {
    contactId: String(c.row.id),
    displayName: String(c.row.display_name ?? "Contacto"),
    primaryPhone: c.row.primary_phone ? String(c.row.primary_phone) : null,
    primaryEmail: c.row.primary_email ? String(c.row.primary_email) : null,
    segment: c.row.segment ? String(c.row.segment) : null,
    ltvUsd: Number(c.row.ltv_usd ?? 0),
    totalOrders: Number(c.row.total_orders ?? 0),
    preferredChannel: c.row.preferred_channel ? String(c.row.preferred_channel) : null,
    marketingOptIn: c.row.marketing_opt_in === true,
    doNotContact: c.row.do_not_contact === true,
    conversaciones: c.convs,
    cotizaciones: c.quotes,
    ordenes: c.orders,
    pagos: c.payments,
  };
}