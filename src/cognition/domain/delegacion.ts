/**
 * HUB by Raisen — Marcador DETERMINISTICO de delegacion de Victor (orquestador). Victor emite
 * [[DELEGAR: agente=<slug>; tarea=<texto>]] o, para broadcast, agrega ; alcance=<audiencia>. El sistema
 * lo parsea, crea el/los borrador(es) del agente REAL en Borradores, y lo quita del texto al dueno.
 * SEPARADO del flujo CONGELADO consulta/escalada (no lo toca). C4 <=75. Sin any.
 */
export interface Delegacion { agente: string; tarea: string; alcance: string }

const RE = /\[\[DELEGAR:\s*([^\]]+)\]\]/g;

export function detectarDelegaciones(texto: string): Delegacion[] {
  const out: Delegacion[] = [];
  for (const m of texto.matchAll(RE)) {
    const inner = m[1] ?? "";
    const agente = (inner.match(/agente\s*=\s*([a-zA-Z]+)/i)?.[1] ?? "").trim().toLowerCase();
    const alcance = (inner.match(/alcance\s*=\s*([^;\]]+)/i)?.[1] ?? "").trim().toLowerCase();
    const tarea = (inner.match(/tarea\s*=\s*([\s\S]+?)(?:;\s*alcance\s*=|$)/i)?.[1] ?? "").trim();
    if (agente && tarea) out.push({ agente, tarea, alcance });
  }
  return out;
}

export function limpiarDelegacion(texto: string): string {
  return texto.replace(RE, "").replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
