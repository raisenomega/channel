/**
 * HUB by Raisen — Envia la respuesta HTTP del servidor.
 * Soporta respuestas JSON normales y custom (contentType, status, body).
 * C4 ≤50 lineas.
 */
import type * as http from "node:http";
import type { HttpResponse } from "./server-types.ts";

export function sendResponse(res: http.ServerResponse, result: unknown): void {
  if (result && !Array.isArray(result) && typeof result === "object" && typeof (result as HttpResponse).body === "string") {
    const custom = result as HttpResponse;
    res.writeHead(custom.status ?? 200, { "Content-Type": custom.contentType ?? "text/plain", ...(custom.headers ?? {}) });
    res.end(custom.body);
    return;
  }
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(result));
}