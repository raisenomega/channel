/**
 * HUB by Raisen — E: deposito DETERMINISTA para la VENTA/INSTALACION de zafacones soterrados (zafacones-ramos).
 * El MONTO lo calcula el CODIGO (el agente lo comunica, NO lo inventa -> ley "nunca inventes montos"). Tramos
 * por cantidad/total; gana el mas alto. Aplica SOLO al item de venta/instalacion (nombre con "soterrad" +
 * "instal"); EXCLUYE la limpieza de soterrados. Destino fijo: ATH Movil Business /zramos. Puro. C4 <=75.
 */
export interface DepositoLinea { readonly description: string; readonly quantity: number; readonly line_total: number; }
export interface Deposito { readonly monto: number; readonly destino: string; }

const DESTINO = "ATH Movil Business /zramos";

// Normaliza (minusculas, sin acentos) y exige "soterrad" + "instal": agarra "Zafacones Soterrados e
// instalados", descarta "Limpieza zafcones soterrados" (no es venta/instalacion).
function esSoterradoInstalado(desc: string): boolean {
  const n = desc.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return n.includes("soterrad") && n.includes("instal");
}

export function calcularDeposito(lineas: readonly DepositoLinea[]): Deposito | null {
  let cantidad = 0; let total = 0;
  for (const l of lineas) {
    if (!esSoterradoInstalado(String(l.description ?? ""))) continue;
    cantidad += Number(l.quantity) || 0;
    total += Number(l.line_total) || 0;
  }
  if (cantidad <= 0) return null; // sin venta de soterrados -> sin deposito
  const monto = total > 1800 ? 500 : cantidad >= 2 ? 250 : 100; // gana el tramo mas alto
  return { monto, destino: DESTINO };
}
