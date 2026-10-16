/**
 * HUB by Raisen — Handler reference: commerce.quote.create (Slide 4.1).
 * Solo contrato + validación. NO persiste en Supabase (Slide 4.2 bis). C4 ≤75.
 */
import { Result, ok, err } from "../../../shared/domain/result.ts";

export interface QuoteDraft {
  readonly id: string;
  readonly tenantId: string;
  readonly items: ReadonlyArray<{ readonly sku: string; readonly qty: number; readonly precio_cents: number }>;
  readonly total_cents: number;
  readonly creado_at: string;
}

type HandlerErr = { readonly kind: "HANDLER_ERROR"; readonly causa: string };

interface RawItem { readonly sku?: unknown; readonly qty?: unknown; readonly precio_cents?: unknown; }

export async function handlerCommerceQuoteCreate(
  params: Readonly<Record<string, unknown>>,
): Promise<Result<QuoteDraft, HandlerErr>> {
  const tenantId = typeof params.tenantId === "string" ? params.tenantId : null;
  if (!tenantId) return err({ kind: "HANDLER_ERROR", causa: "tenantId_requerido" });
  if (!Array.isArray(params.items)) return err({ kind: "HANDLER_ERROR", causa: "items_invalidos" });

  const itemsOutput: Array<{ sku: string; qty: number; precio_cents: number }> = [];
  for (const raw of params.items as RawItem[]) {
    const sku = typeof raw.sku === "string" ? raw.sku : null;
    const qty = typeof raw.qty === "number" && raw.qty > 0 ? raw.qty : null;
    const precio = typeof raw.precio_cents === "number" && raw.precio_cents >= 0 ? raw.precio_cents : null;
    if (!sku || qty === null || precio === null) return err({ kind: "HANDLER_ERROR", causa: "item_invalido" });
    itemsOutput.push({ sku, qty, precio_cents: precio });
  }
  if (itemsOutput.length === 0) return err({ kind: "HANDLER_ERROR", causa: "items_vacios" });
  const total = itemsOutput.reduce((acc, i) => acc + i.qty * i.precio_cents, 0);
  return ok(Object.freeze({
    id: crypto.randomUUID(),
    tenantId,
    items: Object.freeze(itemsOutput),
    total_cents: total,
    creado_at: new Date().toISOString(),
  }));
}