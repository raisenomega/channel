/**
 * HUB by Raisen — Tipos de cotizacion.
 */

export interface RowQuote {
  id: string;
  contact_id: string | null;
  status: string;
  total_amount: number;
  currency: string;
  created_at: string;
  expires_at: string | null;
}