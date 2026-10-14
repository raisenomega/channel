/**
 * HUB by Raisen — Mappers de filas a arrays tipados del contacto.
 */
import type { Contact360 } from "./contact-client-types.ts";
import { num, str } from "./contact-client-types.ts";

export function mapaConv(r: Record<string, unknown>): Contact360["conversaciones"][number] {
  return Object.freeze({
    id: str(r.id), channel: str(r.primary_channel), status: str(r.status),
    lastMessageAt: r.last_message_at ? new Date(str(r.last_message_at)) : new Date(),
  });
}

export function mapaCompra(r: Record<string, unknown>): Contact360["cotizaciones"][number] {
  return Object.freeze({ id: str(r.id), status: str(r.status), totalAmount: num(r.total_amount), currency: str(r.currency), createdAt: r.created_at ? new Date(str(r.created_at)) : new Date() });
}

export function mapaOrden(r: Record<string, unknown>): Contact360["ordenes"][number] {
  return Object.freeze({ id: str(r.id), status: str(r.status), totalAmount: num(r.total_amount), currency: str(r.currency), createdAt: r.created_at ? new Date(str(r.created_at)) : new Date() });
}

export function mapaPago(r: Record<string, unknown>): Contact360["pagos"][number] {
  return Object.freeze({ id: str(r.id), status: str(r.status), amount: num(r.amount), currency: str(r.currency), createdAt: r.created_at ? new Date(str(r.created_at)) : new Date() });
}