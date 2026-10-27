/**
 * HUB by Raisen — Lee el contexto de plataforma (B2 canales conectados + B3 humanos que atienden) desde
 * channel_connections y agents. Service-role; filtra por el tenant del claim. C4 <=75. Sin any.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import type { PlatformContext } from "../domain/platform-context.ts";
import { formatSkuFicha } from "../domain/sku-ficha.ts";

type Ch = { platform?: string; status?: string; is_paused?: boolean };
type Ag = { display_name?: string; role?: string; agent_type?: string; is_active?: boolean };
type It = { name?: string; unit_price?: number; description?: string | null; sku?: string | null; stock?: number | null; track_inventory?: boolean; unit_of_measure?: string | null; lot_number?: string | null; expiry_date?: string | null; is_active?: boolean };

export async function leerPlatformContext(tenantId: string): Promise<PlatformContext> {
  const { data: ch } = await supabase.from("channel_connections").select("platform, status, is_paused").eq("tenant_id", tenantId);
  const { data: ag } = await supabase.from("agents").select("display_name, role, agent_type, is_active").eq("tenant_id", tenantId);
  const { data: it } = await supabase.from("items").select("name, unit_price, description, sku, stock, track_inventory, unit_of_measure, lot_number, expiry_date, is_active").eq("tenant_id", tenantId).limit(200);
  const channels = ((ch ?? []) as Ch[])
    .filter((r) => r.status === "connected" && !r.is_paused)
    .map((r) => String(r.platform ?? ""));
  const humanAgents = ((ag ?? []) as Ag[])
    .filter((r) => r.agent_type === "human" && r.is_active === true)
    .map((r) => `${r.display_name ?? ""} (${r.role ?? ""})`);
  const s = (v: unknown): string | undefined => (typeof v === "string" && v.trim() !== "" ? v.trim() : undefined);
  const catalog = ((it ?? []) as It[])
    .filter((r) => typeof r.name === "string" && r.name.trim() !== "" && r.is_active !== false)
    .map((r) => formatSkuFicha({ name: r.name as string, unitPrice: Number(r.unit_price ?? 0), description: s(r.description),
      sku: s(r.sku), stock: r.stock == null ? null : Number(r.stock), trackInventory: Boolean(r.track_inventory),
      unitOfMeasure: s(r.unit_of_measure), lotNumber: s(r.lot_number), expiryDate: s(r.expiry_date) }));
  return { channels, humanAgents, catalog };
}
