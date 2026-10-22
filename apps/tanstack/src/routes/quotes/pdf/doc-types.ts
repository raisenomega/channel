/**
 * HUB by Raisen — Tipos del documento comercial (alineados a Nucleo): item de linea, cliente, totales.
 */
export interface DocItem {
  description: string;
  quantity: number;
  unitPrice: number;
  discountPct: number;
  taxPct: number;
  lineTotal: number;
}

export interface DocClient { name: string; lines: string[]; }

export interface DocTotals { subtotal: number; tax: number; total: number; currency: string; }
