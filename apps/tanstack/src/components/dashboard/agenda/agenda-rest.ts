/**
 * HUB by Raisen — Helper REST de solo-lectura para la Agenda (RLS por tenant).
 */
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";

export function enc(v: string): string { return encodeURIComponent(v); }

export async function restGet<T>(path: string): Promise<T[]> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return [];
  try {
    const res = await fetch(`${base}/${path}`, { headers });
    if (!res.ok) return [];
    return (await res.json()) as T[];
  } catch { return []; }
}
