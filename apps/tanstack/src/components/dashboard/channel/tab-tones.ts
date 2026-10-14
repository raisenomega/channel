/**
 * HUB by Raisen — Mapeo de estado → tono de Badge para las pestañas
 * cotización, factura y pagos del panel de canal.
 */
import type { BadgeTone } from "@/components/ui/badge";

export const QUOTE_STATUS_TONE: Record<string, BadgeTone> = {
  draft: "warn", sent: "hub", accepted: "success", rejected: "danger", expired: "process",
};

export const ORDER_STATUS_TONE: Record<string, BadgeTone> = {
  pending: "warn", confirmed: "hub", paid: "success", shipped: "process", delivered: "success", cancelled: "danger",
};

export const PAYMENT_STATUS_TONE: Record<string, BadgeTone> = {
  pending: "warn", completed: "success", failed: "danger", refunded: "process",
};