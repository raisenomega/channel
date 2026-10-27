/**
 * HUB by Raisen — P2: propuesta de COTIZACION del agente. Tipos puros + parse del JSON del LLM + totales.
 * El agente propone lineas desde el catalogo SKU; el operador FIRMA para crear la cotizacion real. C4 <=75.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";

export interface CatalogItem { readonly name: string; readonly unitPrice: number; readonly itemType: string; readonly description?: string; readonly sku?: string; readonly stock?: number | null; readonly trackInventory?: boolean; }
export interface QuoteLine { readonly description: string; readonly quantity: number; readonly unitPrice: number; }
export interface QuoteProposal {
  readonly worth: boolean;      // vale proponer cotizacion?
  readonly lines: readonly QuoteLine[];
  readonly conclusion: string;  // por que la propone
  readonly identified: string;  // senal de compra detectada
  readonly confidence: number;  // 0-100, estimacion honesta
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

export function totales(lines: readonly QuoteLine[]): { readonly subtotal: number; readonly total: number } {
  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  return { subtotal: round2(subtotal), total: round2(subtotal) }; // tax a nivel documento lo ajusta el operador
}

export function parseQuoteProposal(raw: string): Result<QuoteProposal, { readonly kind: string }> {
  let j: unknown;
  try { j = JSON.parse(extraerJson(raw)); } catch { return err({ kind: "json_invalido" }); }
  if (typeof j !== "object" || j === null) return err({ kind: "shape_invalido" });
  const o = j as Record<string, unknown>;
  const lines = (Array.isArray(o["lines"]) ? o["lines"] : []).map(toLine).filter((l): l is QuoteLine => l !== null);
  return ok({
    worth: o["worth"] === true && lines.length > 0,
    lines,
    conclusion: typeof o["conclusion"] === "string" ? o["conclusion"] : "",
    identified: typeof o["identified"] === "string" ? o["identified"] : "",
    confidence: clampConf(o["confidence"]),
  });
}

function toLine(x: unknown): QuoteLine | null {
  if (typeof x !== "object" || x === null) return null;
  const o = x as Record<string, unknown>;
  const desc = typeof o["description"] === "string" ? o["description"].trim() : "";
  const qty = Number(o["quantity"]); const price = Number(o["unitPrice"] ?? o["unit_price"]);
  if (desc === "" || !Number.isFinite(qty) || qty <= 0 || !Number.isFinite(price) || price < 0) return null;
  return { description: desc, quantity: qty, unitPrice: round2(price) };
}

function clampConf(x: unknown): number { const n = Number(x); return Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : 0; }
function extraerJson(s: string): string { const a = s.indexOf("{"); const b = s.lastIndexOf("}"); return a >= 0 && b > a ? s.slice(a, b + 1) : s; }
