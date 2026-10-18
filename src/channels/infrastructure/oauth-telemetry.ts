/**
 * HUB by Raisen — V-vigía (Compuerta #138): telemetría trackable del flujo OAuth. request_id
 * end-to-end para correlacionar logs backend (callback / pending-pages / select-page) con los del
 * navegador (popup + tab principal). NO cambia lógica — solo observabilidad. C4 <=75.
 */

/** request_id corto trackable (se propaga por query ?req= + BroadcastChannel + localStorage). */
export const nuevoReqId = (): string => crypto.randomUUID();

/** Lee el req_id de la query (?req=), o "-" si ausente (los logs siguen siendo parseables). */
export function reqIdDeQuery(path: string): string {
  const q = path.includes("?") ? path.split("?")[1] ?? "" : "";
  return new URLSearchParams(q).get("req") || "-";
}

/** Log estructurado uniforme: `[<tag> req=<id>] <msg>`. Un solo formato en todo el flujo. */
export function logOauth(tag: string, reqId: string, msg: string): void {
  console.info(`[${tag} req=${reqId}] ${msg}`);
}
