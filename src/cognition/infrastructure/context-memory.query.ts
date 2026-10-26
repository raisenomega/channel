/**
 * HUB by Raisen — MEMORIA del contexto: el agente lee el contexto COMPLETO una vez y lo reusa sin releer la
 * fuente en cada mensaje. Se refresca a los 15 dias (memoriaVencida) o al invalidar (guardar contexto). C4 <=75.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

const DIAS_15 = 15 * 86400000;

export interface ContextMemory { readonly brandVoice: string; readonly catalogContext: string; readonly refreshedAt: string; }

export async function leerMemoria(tenantId: string): Promise<ContextMemory | null> {
  const { data } = await supabase.from("context_memory").select("brand_voice, catalog_context, refreshed_at").eq("tenant_id", tenantId).maybeSingle();
  if (!data) return null;
  const d = data as { brand_voice: string; catalog_context: string; refreshed_at: string };
  return { brandVoice: d.brand_voice, catalogContext: d.catalog_context, refreshedAt: d.refreshed_at };
}

export function memoriaVencida(refreshedAt: string): boolean {
  return Date.now() - new Date(refreshedAt).getTime() > DIAS_15;
}

export async function guardarMemoria(tenantId: string, brandVoice: string, catalogContext: string): Promise<void> {
  try { await supabase.from("context_memory").upsert({ tenant_id: tenantId, brand_voice: brandVoice, catalog_context: catalogContext, refreshed_at: new Date().toISOString() }, { onConflict: "tenant_id" }); }
  catch { /* fail-safe: la memoria nunca bloquea la respuesta */ }
}

export async function invalidarMemoria(tenantId: string): Promise<void> {
  try { await supabase.from("context_memory").delete().eq("tenant_id", tenantId); } catch { /* fail-safe */ }
}
