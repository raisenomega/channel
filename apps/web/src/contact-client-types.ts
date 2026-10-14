/**
 * HUB by Raisen — Tipos del cliente de contacto (CRM 360).
 */
export type Contact360 = {
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
  readonly conversaciones: readonly { id: string; channel: string; status: string; lastMessageAt: Date }[];
  readonly cotizaciones: readonly { id: string; status: string; totalAmount: number; currency: string; createdAt: Date }[];
  readonly ordenes: readonly { id: string; status: string; totalAmount: number; currency: string; createdAt: Date }[];
  readonly pagos: readonly { id: string; status: string; amount: number; currency: string; createdAt: Date }[];
};

export type ContactError =
  | { readonly kind: "sin_sesion" }
  | { readonly kind: "no_autorizado" }
  | { readonly kind: "no_encontrado" }
  | { readonly kind: "red"; readonly cause: string };

export function num(v: unknown): number {
  return Number(v ?? 0);
}

export function str(v: unknown): string {
  return String(v ?? "");
}