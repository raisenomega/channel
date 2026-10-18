/**
 * HUB by Raisen — V-vigía (Compuerta #138): telemetría trackable del flujo OAuth en el navegador.
 * El request_id lo genera el backend (callback) y llega por ?req= al popup; se propaga por
 * BroadcastChannel + localStorage para sobrevivir el close del popup y correlacionar con Railway.
 * NO cambia lógica — solo observabilidad. try/catch en storage (puede estar bloqueado). C4 <=75.
 */
const KEY = "hub.oauth_req";

/** Log uniforme `[<tag> req=<id>] <msg>` (mismo formato que el backend). */
export function logOauth(tag: string, reqId: string, msg: string): void {
  console.info(`[${tag} req=${reqId}] ${msg}`);
}

/** Persiste el req_id (para que el page-picker lo lea tras cerrarse el popup). */
export function rememberReqId(reqId: string): void {
  if (!reqId || reqId === "-") return;
  try { window.sessionStorage.setItem(KEY, reqId); } catch { /* storage bloqueado: se degrada a "-" */ }
}

/** req_id: primero de la query (?req=), si no del sessionStorage, si no "-" (logs igual parseables). */
export function readReqId(): string {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("req");
    if (fromUrl) return fromUrl;
    return window.sessionStorage.getItem(KEY) || "-";
  } catch { return "-"; }
}
