/**
 * HUB by Raisen — Lee los datos del cliente de una cotizacion (telefono/email/direccion + servicio +
 * numero) para el editor y el PDF. Lee quotes DIRECTO via RLS (mismo camino que el listado que SI
 * funciona); el RPC get_quote_doc resolvia por auth.uid()->users y devolvia vacio para algunos tokens
 * -> editor/PDF en cero. service = notes (el agente/guardado dejan el servicio ahi). C4 <=75.
 */
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";

export interface QuoteDoc { phone: string; email: string; address: string; service: string; quoteNumber: string; }

export async function fetchQuoteDoc(quoteId: string): Promise<QuoteDoc | null> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers || !quoteId) return null;
  try {
    const res = await fetch(`${base}/quotes?id=eq.${quoteId}&select=client_phone,client_email,client_address,notes,quote_number`, { headers });
    if (!res.ok) return null;
    const rows = (await res.json()) as { client_phone?: string; client_email?: string; client_address?: string; notes?: string; quote_number?: string }[];
    const r = rows[0];
    if (!r) return null;
    return { phone: r.client_phone ?? "", email: r.client_email ?? "", address: r.client_address ?? "", service: r.notes ?? "", quoteNumber: r.quote_number ?? "" };
  } catch {
    return null;
  }
}
