/**
 * HUB by Raisen — Handoff de plantilla PREPARADA: el modal de uso guarda el texto listo y el celular shell
 * lo recoge para pre-llenar el composer (lista para usar; el humano dispara). Per-viewer (localStorage),
 * de un solo uso (se limpia al tomarlo). NO auto-envia. C4 <=75. Sin any.
 */
const K = "hub.template.prepared";

export function guardarPreparada(texto: string): void {
  try { window.localStorage.setItem(K, texto); } catch { /* storage bloqueado: no bloquea el flujo */ }
}

export function tomarPreparada(): string {
  try {
    const v = window.localStorage.getItem(K);
    if (v) window.localStorage.removeItem(K);
    return v ?? "";
  } catch {
    return "";
  }
}
