/**
 * HUB by Raisen — Badge "plantillas nuevas" para el chip de Canales (per-viewer, localStorage).
 * Al "Usar" una plantilla se marca; el chip muestra el conteo; al abrirlo se limpia. C4 <=75.
 */
const KEY = "hub_plantillas_nuevas";

function leer(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]") as unknown;
    return Array.isArray(v) ? (v as string[]) : [];
  } catch {
    return [];
  }
}

export function marcarPlantillaNueva(name: string): void {
  try {
    const s = new Set(leer());
    s.add(name);
    localStorage.setItem(KEY, JSON.stringify([...s]));
  } catch {
    /* localStorage no disponible: el badge es best-effort */
  }
}

export function contarPlantillasNuevas(): number {
  return leer().length;
}

export function limpiarPlantillasNuevas(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* no-op */
  }
}
