/**
 * HUB by Raisen — CRM auto-calificacion (valor): decide a que nivel SUBE un contacto segun su comportamiento.
 * Escalera (solo sube, nunca baja): General -> Nuevo (mostro intencion) -> Regular (compro) -> VIP (alto valor).
 * Mapeada a los niveles que ya tiene la BD: new_lead=General, prospect=Nuevo, customer=Regular, vip=VIP.
 * Funcion PURA (testeable). C4 <=75. Sin any.
 */
export interface QualifySignals {
  readonly opportunity: boolean; // mostro intencion de compra en el mensaje
  readonly totalOrders: number;  // compras completadas
}

const POR_RANK = ["new_lead", "prospect", "customer", "vip"] as const; // General, Nuevo, Regular, VIP
const RANK: Record<string, number> = { new_lead: 0, prospect: 1, customer: 2, vip: 3 };

export function calificarSegmento(actual: string | null, s: QualifySignals, vipMin = 5): string | null {
  let target = 0; // General por defecto
  if (s.opportunity) target = Math.max(target, 1);     // Nuevo: mostro intencion
  if (s.totalOrders >= 1) target = Math.max(target, 2); // Regular: ya compro
  if (s.totalOrders >= vipMin) target = 3;              // VIP: alto volumen
  const cur = RANK[actual ?? "new_lead"] ?? 0;
  if (target <= cur) return null; // ya esta igual o mas arriba -> no cambia (nunca baja)
  return POR_RANK[target] ?? null;
}
