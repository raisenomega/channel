/**
 * HUB by Raisen — P2: lee el catalogo SKU (items) de un tenant para que el agente proponga cotizaciones.
 * Service-role (bypasea RLS); se filtra EXPLICITO por tenant_id. C4 <=75.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import type { CatalogItem } from "../domain/quote-proposal.ts";

export async function leerCatalogoSku(tenantId: string): Promise<CatalogItem[]> {
  const { data } = await supabase.from("items").select("name, description, sku, unit_price, item_type, stock, track_inventory, unit_of_measure, lot_number, expiry_date, is_active").eq("tenant_id", tenantId).limit(200);
  const rows = (data ?? []) as Array<{ name?: string; description?: string | null; sku?: string | null; unit_price?: number; item_type?: string; stock?: number | null; track_inventory?: boolean; unit_of_measure?: string | null; lot_number?: string | null; expiry_date?: string | null; is_active?: boolean }>;
  return rows
    .filter((r) => typeof r.name === "string" && r.name.trim() !== "" && r.is_active !== false) // no cotiza inactivos
    .map((r) => {
      const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
      const desc = typeof r.description === "string" ? r.description : "";
      return { name: r.name as string, unitPrice: Number(r.unit_price ?? 0), itemType: r.item_type ?? "servicio",
        stock: r.stock == null ? null : Number(r.stock), trackInventory: Boolean(r.track_inventory),
        ...(desc ? { description: desc } : {}), ...(str(r.sku) ? { sku: str(r.sku) } : {}),
        ...(str(r.unit_of_measure) ? { unitOfMeasure: str(r.unit_of_measure) } : {}),
        ...(str(r.lot_number) ? { lotNumber: str(r.lot_number) } : {}),
        ...(str(r.expiry_date) ? { expiryDate: str(r.expiry_date) } : {}) };
    });
}
