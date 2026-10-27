/**
 * HUB by Raisen — Formateador UNICO de la ficha de un SKU. TODOS los agentes (Victor + operativos) leen la
 * tarjeta COMPLETA byte a byte: codigo, nombre, precio, que incluye (descripcion), cantidad y vencimiento.
 * Es la FUENTE PRIMARIA del agente para hablar de productos. Puro (sin IO). C4 <=75.
 */
export interface SkuFicha {
  readonly name: string;
  readonly unitPrice: number;
  readonly description?: string | undefined;
  readonly sku?: string | undefined;
  readonly stock?: number | null | undefined;
  readonly trackInventory?: boolean | undefined;
  readonly unitOfMeasure?: string | undefined;
  readonly lotNumber?: string | undefined;
  readonly expiryDate?: string | undefined;
}

export function formatSkuFicha(i: SkuFicha): string {
  const cod = i.sku ? `[${i.sku}] ` : "";
  const bits: string[] = [];
  if (i.trackInventory || (typeof i.stock === "number" && i.stock > 0)) bits.push(`cantidad disponible: ${i.stock ?? 0}${i.unitOfMeasure ? " " + i.unitOfMeasure : ""}`);
  if (i.lotNumber) bits.push(`lote: ${i.lotNumber}`);
  if (i.expiryDate) bits.push(`vence: ${i.expiryDate}`);
  const meta = bits.length ? ` | ${bits.join(" | ")}` : "";
  const inc = i.description && i.description.trim() ? `\n    Incluye: ${i.description.trim()}` : "";
  return `- ${cod}${i.name} ($${i.unitPrice})${meta}${inc}`;
}
