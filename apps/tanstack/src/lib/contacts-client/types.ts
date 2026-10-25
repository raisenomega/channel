/**
 * HUB by Raisen — Tipos del cliente de contactos.
 */

export type ContactError = { kind: "no_autorizado" | "red" | "config_incompleta"; cause?: string };
export type Result<T> = { ok: true; value: T } | { ok: false; error: ContactError };

export interface RawContact {
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

export interface ContactListItem {
  id: string;
  displayName: string;
  phone: string | null;
  email: string | null;
  segment: string | null;
  ltvUsd: number;
  totalOrders: number;
  channel: string | null;
}