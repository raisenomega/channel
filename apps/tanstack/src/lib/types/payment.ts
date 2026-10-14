/**
 * HUB by Raisen — Tipos de pago.
 */

export interface RowPayment {
  id: string;
  order_id: string | null;
  quote_id: string | null;
  status: string;
  amount: number;
  currency: string;
  provider: string | null;
  created_at: string;
}