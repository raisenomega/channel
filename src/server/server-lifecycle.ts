/**
 * HUB by Raisen — Ciclo de vida del servidor HTTP: (1) lectura de body acotada -> responde 413/408 en vez
 * de colgar/OOM; (2) timeouts de conexion (slow-loris); (3) graceful shutdown: en cada deploy SIGTERM drena
 * los requests en vuelo en vez de cortarlos en seco (perdida de trabajo). C4 <=75. Sin any.
 */
import type * as http from "node:http";
import nodeProcess from "node:process"; // default export: expone .on/.exit (el namespace * solo trae named exports como .env)
import { readBody } from "./server-helpers.ts";

// Lee el body con limite/timeout; si falla responde 413 (grande) / 408 (timeout) y devuelve null.
export async function leerBodyOResponder(req: http.IncomingMessage, res: http.ServerResponse): Promise<string | null> {
  try {
    return await readBody(req);
  } catch (e) {
    const grande = String(e).includes("too_large");
    res.writeHead(grande ? 413 : 408, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: { kind: grande ? "body_too_large" : "body_timeout" } }));
    return null;
  }
}

export function configurarTimeouts(server: http.Server): void {
  server.requestTimeout = 30000;   // corta requests que no completan en 30s
  server.headersTimeout = 20000;   // headers lentos (slow-loris)
  server.keepAliveTimeout = 10000;
}

export function instalarGracefulShutdown(server: http.Server, drainMs = 10000): void {
  let cerrando = false;
  const cerrar = (sig: string): void => {
    if (cerrando) return;
    cerrando = true;
    console.log(`[HUB] ${sig} recibido: dejando de aceptar, drenando...`);
    server.close(() => { console.log("[HUB] servidor cerrado limpio"); nodeProcess.exit(0); });
    setTimeout(() => { console.log("[HUB] drain timeout: salida forzada"); nodeProcess.exit(0); }, drainMs).unref();
  };
  nodeProcess.on("SIGTERM", () => cerrar("SIGTERM"));
  nodeProcess.on("SIGINT", () => cerrar("SIGINT"));
}
