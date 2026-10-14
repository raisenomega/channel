/**
 * HUB by Raisen — HTTP Server minimo (Node.js native: node:http).
 *
 * Arranca el runtime que conecta los handlers de application con
 * repositorios reales de infrastructure (Supabase).
 * Submódulos bajo src/server/ (C4 ≤75 líneas por archivo).
 *
 * USO:
 *   node --experimental-strip-types src/server/hub.server.ts
 *   bash scripts/start-server.sh
 */
import "./deno-polyfill.ts";
import * as nodeProcess from "node:process";
import * as http from "node:http";
import { buildHandlers } from "./server-routes.ts";
import { registrarRutas, matchRoute } from "./server-routes-registry.ts";
import { extractJwt, parseBody, readBody } from "./server-helpers.ts";
import type { RequestContext } from "./server-types.ts";

const PORT = parseInt(nodeProcess.env["PORT"] ?? "8080", 10);
const HOST = nodeProcess.env["HOST"] ?? "0.0.0.0";

const handlers = buildHandlers();
const routes = registrarRutas(handlers);

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const rawBody = await readBody(req);
  const thePath = req.url ?? "/";
  const theMethod = req.method ?? "GET";

  const ctx: RequestContext = {
    method: theMethod,
    path: thePath,
    headers: req.headers as Record<string, string | string[] | undefined>,
    body: parseBody(rawBody),
    jwt: extractJwt(req.headers as Record<string, string | string[] | undefined>),
  };

  const route = matchRoute(routes, theMethod, thePath);
  if (!route) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: { kind: "ruta_no_encontrada", path: thePath } }));
    return;
  }

  try {
    const result = await route.handler(ctx);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result));
  } catch (err) {
    console.error("[HUB] Error en handler:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: { kind: "internal_error", message: String(err) } }));
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[HUB] Server escuchando en http://${HOST}:${PORT}`);
  console.log(`[HUB] Rutas registradas:`);
  for (const r of routes) {
    console.log(`       ${r.method} ${r.path}`);
  }
});