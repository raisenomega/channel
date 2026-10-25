/**
 * HUB by Raisen — P2: lee el catalogo SKU (items) de un tenant para que el agente proponga cotizaciones.
 * Service-role (bypasea RLS); se filtra EXPLICITO por tenant_id. C4 <=75.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import type { CatalogItem } from "../domain/quote-proposal.ts";

export async function leerCatalogoSku(tenantId: string): Promise<CatalogItem[]> {
  const { data } = await supabase.from("items").select("name, unit_price, item_type").eq("tenant_id", tenantId).limit(200);
  const rows = (data ?? []) as Array<{ name?: string; unit_price?: number; item_type?: string }>;
  return rows
    .filter((r) => typeof r.name === "string" && r.name.trim() !== "")
    .map((r) => ({ name: r.name as string, unitPrice: Number(r.unit_price ?? 0), itemType: r.item_type ?? "servicio" }));
}
