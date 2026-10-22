/**
 * HUB by Raisen — Tipos del documento comercial: item de linea, cliente, totales, config de tax.
 */
export interface DocItem {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface DocClient { name: string; lines: string[]; }

export interface DocTotals { subtotal: number; tax: number; total: number; currency: string; }

/** Tax a nivel documento: porcentaje del subtotal o cantidad fija, en la moneda elegida. */
export interface TaxConfig { mode: "pct" | "fixed"; value: number; currency: string; }
