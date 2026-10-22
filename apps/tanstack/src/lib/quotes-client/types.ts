/**
 * HUB by Raisen — Tipos del cliente de cotizaciones.
 */

export type QuoteError = { kind: "no_autorizado" | "red" | "config_incompleta"; cause?: string };
export type Result<T> = { ok: true; value: T } | { ok: false; error: QuoteError };

export interface RawQuote {
  id: string;
  contact_id: string | null;
  status: string;
  total_amount: number;
  currency: string;
  created_at: string;
  expired_at: string | null;
  responded_at: string | null;
}

export interface QuoteListItem {
  id: string;
  contactId: string | null;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  expiresAt: string | null;
  respondedAt: string | null;
}