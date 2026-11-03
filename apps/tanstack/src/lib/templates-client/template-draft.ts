/**
 * HUB by Raisen — Borrador de USO de plantilla: los valores que el usuario rellena en el modal
 * (encabezado/foto/cuerpo/link). NO muta el catalogo aprobado; los limites siguen las reglas de Meta.
 * requiereAprobacion = agregar header/foto/link o cambiar el body aprobado -> Meta debe re-aprobar. C4 <=75.
 */
export type HeaderMode = "none" | "text" | "image";

export interface UsageDraft {
  name: string;
  headerMode: HeaderMode;
  headerText: string;
  imageUrl: string;
  body: string;
  linkText: string;
  linkUrl: string;
  ventana24h: boolean;
}

// Limites reales de Meta para componentes de plantilla.
export const LIM = { header: 60, body: 1024, linkText: 25 } as const;

export function draftInicial(name: string, body: string): UsageDraft {
  return { name, headerMode: "none", headerText: "", imageUrl: "", body, linkText: "", linkUrl: "", ventana24h: true };
}

// Si agrega header/foto/link que la plantilla aprobada no tenia, o cambia el body -> requiere re-aprobacion.
export function requiereAprobacion(d: UsageDraft, bodyAprobado: string): boolean {
  return d.headerMode !== "none" || d.imageUrl.trim() !== "" || d.linkUrl.trim() !== "" || d.body.trim() !== bodyAprobado.trim();
}

export function fueraDeLimite(d: UsageDraft): boolean {
  return d.headerText.length > LIM.header || d.body.length > LIM.body || d.linkText.length > LIM.linkText;
}
