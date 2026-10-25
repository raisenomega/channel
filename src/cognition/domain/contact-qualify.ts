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

const TEMP = ["frio", "tibio", "caliente", "convertido"] as const;
const TRANK: Record<string, number> = { frio: 0, tibio: 1, caliente: 2, convertido: 3 };

// Temperatura de venta (solo sube): hubo interaccion -> tibio; intencion -> caliente; ya compro -> convertido.
export function calificarTemperatura(actual: string | null, s: QualifySignals): string | null {
  let target = 1; // tibio: llego un mensaje entrante del contacto
  if (s.opportunity) target = Math.max(target, 2);      // caliente: mostro intencion de compra
  if (s.totalOrders >= 1) target = 3;                   // convertido: ya compro
  const cur = TRANK[actual ?? "frio"] ?? 0;
  if (target <= cur) return null; // ya igual o mas caliente -> no cambia
  return TEMP[target] ?? null;
}
