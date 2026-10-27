/**
 * HUB by Raisen — Catalogo SKU: items + categorias, via RPC SECURITY DEFINER (users.tenant_id). Items con
 * campos completos (afinidad Nucleo: sku/stock/lote/vencimiento/costo/impuesto/unidad/barcode/imagen). C4 <=75.
 */
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";

export interface CatalogItem {
  id: string; name: string; description: string | null; unitPrice: number;
  categoryId: string | null; categoryName: string | null; itemType: string;
  sku: string | null; stock: number | null; trackInventory: boolean; lotNumber: string | null;
  expiryDate: string | null; unitCost: number; taxRate: number; unitOfMeasure: string | null;
  barcode: string | null; imageUrl: string | null; isActive: boolean;
}
export interface ItemInput {
  name: string; description: string; unit_price: number; category_id: string | null; item_type: string;
  sku: string; stock: string; track_inventory: boolean; lot_number: string; expiry_date: string;
  unit_cost: number; tax_rate: number; unit_of_measure: string; barcode: string; image_url: string; is_active: boolean;
}
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

interface Row {
  id: string; name: string; description: string | null; unit_price: number; category_id: string | null;
  category_name: string | null; item_type: string; sku: string | null; stock: number | null;
  track_inventory: boolean; lot_number: string | null; expiry_date: string | null; unit_cost: number;
  tax_rate: number; unit_of_measure: string | null; barcode: string | null; image_url: string | null; is_active: boolean;
}

export async function listItems(): Promise<CatalogItem[]> {
  const rows = await rpc<Row[]>("list_items", {});
  return (rows ?? []).map((r) => ({
    id: r.id, name: r.name, description: r.description, unitPrice: Number(r.unit_price), categoryId: r.category_id,
    categoryName: r.category_name, itemType: r.item_type ?? "servicio", sku: r.sku, stock: r.stock == null ? null : Number(r.stock),
    trackInventory: Boolean(r.track_inventory), lotNumber: r.lot_number, expiryDate: r.expiry_date, unitCost: Number(r.unit_cost ?? 0),
    taxRate: Number(r.tax_rate ?? 0), unitOfMeasure: r.unit_of_measure, barcode: r.barcode, imageUrl: r.image_url, isActive: r.is_active !== false,
  }));
}
export async function createItem(p: ItemInput): Promise<string | null> {
  return rpc<string>("create_item", { p });
}
export async function updateItem(id: string, p: ItemInput): Promise<boolean> {
  return (await rpc<boolean>("update_item", { p_id: id, p })) === true;
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
