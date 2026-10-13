/**
 * HUB by Raisen — Ficha 360 del contacto (datos reales del tenant via RLS)
 * Consulta `contacts` con el JWT del usuario; el RLS filtra por tenant.
 */
import { Result, err, ok } from "@shared/domain/result.ts";
import { auth } from "./auth-client.ts";

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
};

export type ContactError =
  | { readonly kind: "sin_sesion" }
  | { readonly kind: "no_autorizado" }
  | { readonly kind: "no_encontrado" }
  | { readonly kind: "red"; readonly cause: string };

export async function cargarContacto(id: string): Promise<Result<Contact360, ContactError>> {
  const sesion = auth.leer();
  const cfg = (globalThis as Record<string, unknown>).__HUB_CONFIG__ as
    { supabaseUrl: string; anonKey: string } | undefined;
  if (!sesion) return err({ kind: "sin_sesion" });
  if (!cfg?.supabaseUrl || !cfg.anonKey) return err({ kind: "red", cause: "config_incompleta" });

  try {
    const cols = ["id", "display_name", "primary_phone", "primary_email", "segment", "ltv_usd", "total_orders", "preferred_channel", "marketing_opt_in", "do_not_contact"];
    const url = `${cfg.supabaseUrl}/rest/v1/contacts?id=eq.${encodeURIComponent(id)}&select=${cols.join(",")}&limit=1`;
    const res = await fetch(url, {
      headers: {
        apikey: cfg.anonKey,
        authorization: `Bearer ${sesion.accessToken}`,
        accept: "application/json",
      },
    });
    if (res.status === 401 || res.status === 403) return err({ kind: "no_autorizado" });
    if (!res.ok) return err({ kind: "red", cause: `status ${res.status}` });
    const filas = (await res.json()) as Array<Record<string, unknown>>;
    const row = filas[0];
    if (!row) return err({ kind: "no_encontrado" });
    return ok(Object.freeze({
      contactId: String(row.id),
      displayName: String(row.display_name ?? "Contacto"),
      primaryPhone: row.primary_phone ? String(row.primary_phone) : null,
      primaryEmail: row.primary_email ? String(row.primary_email) : null,
      segment: row.segment ? String(row.segment) : null,
      ltvUsd: Number(row.ltv_usd ?? 0),
      totalOrders: Number(row.total_orders ?? 0),
      preferredChannel: row.preferred_channel ? String(row.preferred_channel) : null,
      marketingOptIn: row.marketing_opt_in === true,
      doNotContact: row.do_not_contact === true,
    }));
  } catch (e) {
    return err({ kind: "red", cause: String(e) });
  }
}