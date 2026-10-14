/**
 * HUB by Raisen — Tipos de contacto.
 */

export interface RowContact {
  id: string;
  display_name: string | null;
  primary_phone: string | null;
  primary_email: string | null;
  segment: string | null;
  ltv_usd: number | null;
  total_orders: number | null;
  preferred_channel: string | null;
  marketing_opt_in: boolean | null;
  do_not_contact: boolean | null;
}

export interface Contact360 {
  readonly contactId: string;
  readonly displayName: string;
  readonly primaryPhone: string | null;
  readonly primaryEmail: string | null;
  readonly segment: string | null;
  readonly ltvUsd: number;
  readonly totalOrders: number;
  readonly preferredChannel: string | null;
  readonly marketingOptIn: boolean;
  readonly doNotContact: boolean;
  readonly conversaciones: readonly { id: string; channel: string; status: string; lastMessageAt: string }[];
  readonly cotizaciones: readonly { id: string; status: string; totalAmount: number; currency: string; createdAt: string }[];
  readonly ordenes: readonly { id: string; status: string; totalAmount: number; currency: string; createdAt: string }[];
  readonly pagos: readonly { id: string; status: string; amount: number; currency: string; createdAt: string }[];
}