/**
 * HUB by Raisen — CRM auto-calificacion (valor): decide a que nivel SUBE un contacto segun su comportamiento.
 * Escalera (solo sube, nunca baja): general (base) -> nuevo (mostro intencion) -> regular (compro) -> vip.
 * Valores alineados con el frontend y la BD (migr 091). Funcion PURA (testeable). C4 <=75. Sin any.
 */
export interface QualifySignals {
  readonly opportunity: boolean; // mostro intencion de compra en el mensaje
  readonly totalOrders: number;  // compras completadas
}

const POR_RANK = ["general", "nuevo", "regular", "vip"] as const;
const RANK: Record<string, number> = { general: 0, nuevo: 1, regular: 2, vip: 3 };

export function calificarSegmento(actual: string | null, s: QualifySignals, vipMin = 5): string | null {
  let target = 0; // general por defecto
  if (s.opportunity) target = Math.max(target, 1);      // nuevo: mostro intencion
  if (s.totalOrders >= 1) target = Math.max(target, 2); // regular: ya compro
  if (s.totalOrders >= vipMin) target = 3;              // vip: alto volumen
  const cur = RANK[actual ?? "general"] ?? 0;
  if (target <= cur) return null; // ya esta igual o mas arriba -> no cambia (nunca baja)
  return POR_RANK[target] ?? null;
}
