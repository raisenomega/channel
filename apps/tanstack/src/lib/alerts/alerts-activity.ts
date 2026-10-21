/**
 * HUB by Raisen — Fetchers/writer de actividad para badges (Opción B: polling, datos REALES, cero mocks).
 * Actividad -> filas {key, created_at}. Estado de lectura (channel_read_state) -> por usuario y persistente
 * entre dispositivos. RLS en todas las tablas -> solo tu tenant/usuario.
 */
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";
import { readLocalSession } from "@/lib/auth";

export interface ActivityRow { key: string; created_at: string }

async function get(path: string): Promise<Array<Record<string, unknown>>> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return [];
  try {
    const res = await fetch(`${base}${path}`, { headers });
    return res.ok ? ((await res.json()) as Array<Record<string, unknown>>) : [];
  } catch {
    return [];
  }
}

export async function fetchInboundActivity(): Promise<ActivityRow[]> {
  const rows = await get(`/messages?select=channel,created_at&direction=eq.inbound&order=created_at.desc&limit=200`);
  return rows.map((r) => ({ key: `channel:${String(r.channel ?? "")}`, created_at: String(r.created_at ?? "") }));
}

export async function fetchCrmActivity(): Promise<ActivityRow[]> {
  const [o, p, q] = await Promise.all([
    get(`/orders?select=created_at&order=created_at.desc&limit=100`),
    get(`/payments?select=created_at&order=created_at.desc&limit=100`),
    get(`/quotes?select=created_at&order=created_at.desc&limit=100`),
  ]);
  const map = (rows: Array<Record<string, unknown>>, key: string): ActivityRow[] => rows.map((r) => ({ key, created_at: String(r.created_at ?? "") }));
  return [...map(o, "crm:orders"), ...map(p, "crm:payments"), ...map(q, "crm:quotes")];
}

// Estado de lectura por usuario (cross-device): scope_key -> epochMs del último visto.
export async function fetchReadState(): Promise<Record<string, number>> {
  const rows = await get(`/channel_read_state?select=scope_key,last_read_at`);
  const out: Record<string, number> = {};
  for (const r of rows) out[String(r.scope_key)] = new Date(String(r.last_read_at)).getTime();
  return out;
}

function identity(): { tenantId: string; userId: string } | null {
  const s = readLocalSession();
  if (!s?.access_token || !s.user?.id) return null;
  try {
    const b64 = (s.access_token.split(".")[1] ?? "").replace(/-/g, "+").replace(/_/g, "/");
    const p = JSON.parse(atob(b64)) as { app_metadata?: { tenant_id?: string } };
    const tenantId = p.app_metadata?.tenant_id;
    return tenantId ? { tenantId, userId: s.user.id } : null;
  } catch { return null; }
}

// Marca una clave como vista AHORA (upsert por PK) -> persiste y sincroniza entre dispositivos.
export async function markReadRemote(scopeKey: string): Promise<void> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  const id = identity();
  if (!base || !headers || !id) return;
  try {
    await fetch(`${base}/channel_read_state`, {
      method: "POST",
      headers: { ...headers, "content-type": "application/json", prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ tenant_id: id.tenantId, user_id: id.userId, scope_key: scopeKey, last_read_at: new Date().toISOString() }),
    });
  } catch { /* best-effort */ }
}
