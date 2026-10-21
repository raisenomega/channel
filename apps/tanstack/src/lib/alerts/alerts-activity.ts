/**
 * HUB by Raisen — Fetcher de actividad para badges (Opción B: polling, datos REALES).
 * Trae los mensajes ENTRANTES recientes por canal; RLS scopea a tu tenant. El provider deriva de aquí
 * cuántos entraron por canal desde la última vez que abriste ese canal (cero mocks).
 */
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";

export interface ActivityRow { channel: string; created_at: string }

export async function fetchInboundActivity(): Promise<ActivityRow[]> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return [];
  const url = `${base}/messages?select=channel,created_at&direction=eq.inbound&order=created_at.desc&limit=200`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    return (await res.json()) as ActivityRow[];
  } catch {
    return [];
  }
}
