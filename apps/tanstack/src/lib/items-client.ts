/**
 * HUB by Raisen — Catalogo de items (SKU). Lectura/escritura via RPC SECURITY DEFINER (users.tenant_id),
 * robusto ante current_tenant() que no resuelve para este owner. C4 <=75.
 */
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";

export interface CatalogItem { id: string; name: string; description: string | null; unitPrice: number; itemType: string; }

async function rpc<T>(fn: string, body: Record<string, unknown>): Promise<T | null> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return null;
  try {
    const res = await fetch(`${base}/rpc/${fn}`, { method: "POST", headers: { ...headers, "content-type": "application/json" }, body: JSON.stringify(body) });
    return res.ok ? ((await res.json()) as T) : null;
  } catch { return null; }
}

export async function listItems(): Promise<CatalogItem[]> {
  const rows = await rpc<Array<{ id: string; name: string; description: string | null; unit_price: number; item_type: string }>>("list_items", {});
  return (rows ?? []).map((r) => ({ id: r.id, name: r.name, description: r.description, unitPrice: Number(r.unit_price), itemType: r.item_type }));
}

export async function createItem(name: string, description: string, unitPrice: number, type: string): Promise<string | null> {
  return rpc<string>("create_item", { p_name: name, p_description: description, p_unit_price: unitPrice, p_type: type });
}

export async function deleteItem(id: string): Promise<boolean> {
  return (await rpc<boolean>("delete_item", { p_id: id })) === true;
}
