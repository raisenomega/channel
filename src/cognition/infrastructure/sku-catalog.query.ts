/**
 * HUB by Raisen — P2: lee el catalogo SKU (items) de un tenant para que el agente proponga cotizaciones.
 * Service-role (bypasea RLS); se filtra EXPLICITO por tenant_id. C4 <=75.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import type { CatalogItem } from "../domain/quote-proposal.ts";

export async function leerCatalogoSku(tenantId: string): Promise<CatalogItem[]> {
  const { data } = await supabase.from("items").select("name, description, sku, unit_price, item_type, stock, track_inventory, is_active").eq("tenant_id", tenantId).limit(200);
  const rows = (data ?? []) as Array<{ name?: string; description?: string | null; sku?: string | null; unit_price?: number; item_type?: string; stock?: number | null; track_inventory?: boolean; is_active?: boolean }>;
  return rows
    .filter((r) => typeof r.name === "string" && r.name.trim() !== "" && r.is_active !== false) // no cotiza inactivos
    .map((r) => {
      const desc = typeof r.description === "string" ? r.description : "";
      const sku = typeof r.sku === "string" ? r.sku.trim() : "";
      return { name: r.name as string, unitPrice: Number(r.unit_price ?? 0), itemType: r.item_type ?? "servicio",
        stock: r.stock == null ? null : Number(r.stock), trackInventory: Boolean(r.track_inventory),
        ...(desc ? { description: desc } : {}), ...(sku ? { sku } : {}) };
    });
}
