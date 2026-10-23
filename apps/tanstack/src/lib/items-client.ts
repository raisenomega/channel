/**
 * HUB by Raisen — Catalogo SKU: items + categorias, via RPC SECURITY DEFINER (users.tenant_id). C4 <=75.
 */
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";

export interface CatalogItem { id: string; name: string; description: string | null; unitPrice: number; categoryId: string | null; categoryName: string | null; }
export interface Category { id: string; name: string; }

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
  const rows = await rpc<Array<{ id: string; name: string; description: string | null; unit_price: number; category_id: string | null; category_name: string | null }>>("list_items", {});
  return (rows ?? []).map((r) => ({ id: r.id, name: r.name, description: r.description, unitPrice: Number(r.unit_price), categoryId: r.category_id, categoryName: r.category_name }));
}
export async function createItem(name: string, description: string, unitPrice: number, categoryId: string | null): Promise<string | null> {
  return rpc<string>("create_item", { p_name: name, p_description: description, p_unit_price: unitPrice, p_category_id: categoryId });
}
export async function updateItem(id: string, name: string, description: string, unitPrice: number, categoryId: string | null): Promise<boolean> {
  return (await rpc<boolean>("update_item", { p_id: id, p_name: name, p_description: description, p_unit_price: unitPrice, p_category_id: categoryId })) === true;
}
export async function deleteItem(id: string): Promise<boolean> {
  return (await rpc<boolean>("delete_item", { p_id: id })) === true;
}
export async function listCategories(): Promise<Category[]> {
  return (await rpc<Category[]>("list_item_categories", {})) ?? [];
}
export async function createCategory(name: string): Promise<string | null> {
  return rpc<string>("create_item_category", { p_name: name });
}
export async function deleteCategory(id: string): Promise<boolean> {
  return (await rpc<boolean>("delete_item_category", { p_id: id })) === true;
}
