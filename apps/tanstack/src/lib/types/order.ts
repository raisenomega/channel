/**
 * HUB by Raisen — Tipos de orden.
 */

export interface RowOrder {
  id: string;
  quote_id: string | null;
  contact_id: string | null;
  status: string;
  total_amount: number;
  currency: string;
  created_at: string;
  paid_at: string | null;
}