/**
 * HUB by Raisen — Marcador DETERMINISTICO de delegacion de Victor (orquestador). Cuando el dueno le pide
 * que un agente PREPARE algo, Victor emite [[DELEGAR: agente=<slug>; tarea=<texto>]]; el sistema lo parsea,
 * crea el borrador del agente REAL en Borradores, y lo quita del texto que ve el dueno. SEPARADO del flujo
 * CONGELADO de consulta/escalada (no lo toca). C4 <=75. Sin any.
 */
export interface Delegacion { agente: string; tarea: string }

const RE = /\[\[DELEGAR:\s*agente\s*=\s*([a-zA-Z]+)\s*;\s*tarea\s*=\s*([^\]]+)\]\]/g;

export function detectarDelegaciones(texto: string): Delegacion[] {
  const out: Delegacion[] = [];
  for (const m of texto.matchAll(RE)) {
    const agente = String(m[1] ?? "").trim().toLowerCase();
    const tarea = String(m[2] ?? "").trim();
    if (agente && tarea) out.push({ agente, tarea });
  }
  return out;
}

export function limpiarDelegacion(texto: string): string {
  return texto.replace(RE, "").replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
