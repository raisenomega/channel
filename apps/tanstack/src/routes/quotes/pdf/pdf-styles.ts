/**
 * HUB by Raisen — Estilos de plantilla PDF (hasta 3). Uno se elige y se usa en todo el ciclo
 * (cotizacion -> factura -> orden): solo cambia el titulo del encabezado. C4 <=75.
 */
export type PdfStyleId = "clasico" | "moderno" | "minimal";

export interface PdfStyleDef {
  id: PdfStyleId;
  accent: string;
}

export const PDF_STYLES: PdfStyleDef[] = [
  { id: "clasico", accent: "#b8860b" },
  { id: "moderno", accent: "#2563eb" },
  { id: "minimal", accent: "#444444" },
];

export function styleOf(id: string | null | undefined): PdfStyleDef {
  return PDF_STYLES.find((s) => s.id === id) ?? { id: "clasico", accent: "#b8860b" };
}
