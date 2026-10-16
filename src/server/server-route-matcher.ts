/**
 * HUB by Raisen — Matcher de rutas HTTP con soporte de :param (Hotfix A).
 * Dos pasadas: literal gana siempre sobre parametrica. Query string ignorado
 * para el match (ctx.path lo conserva). Params congelados. Zero throw. C4 <=75.
 */
import type { RouteDefinition } from "./server-types.ts";

export interface RouteMatch {
  readonly route: RouteDefinition;
  readonly params: Readonly<Record<string, string>>;
}

const SIN_PARAMS: Readonly<Record<string, string>> = Object.freeze({});

function normalizar(pathname: string): string {
  const sinQuery = pathname.split("?")[0] ?? "";
  return sinQuery.replace(/\/+$/, "") || "/";
}

export function matchRoute(routes: readonly RouteDefinition[], method: string, pathname: string): RouteMatch | null {
  const clean = normalizar(pathname);
  for (const r of routes) {
    if (r.method === method && normalizar(r.path) === clean) return { route: r, params: SIN_PARAMS };
  }
  for (const r of routes) {
    if (r.method !== method || !r.path.includes(":")) continue;
    const params = matchParametricPath(normalizar(r.path), clean);
    if (params) return { route: r, params };
  }
  return null;
}

export function matchParametricPath(pattern: string, pathname: string): Readonly<Record<string, string>> | null {
  const pSegs = pattern.split("/");
  const aSegs = pathname.split("/");
  if (pSegs.length !== aSegs.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pSegs.length; i++) {
    const p = pSegs[i] ?? "";
    const a = aSegs[i] ?? "";
    if (p.startsWith(":")) {
      const valor = decodificar(a);
      if (valor === null || valor === "") return null;
      params[p.slice(1)] = valor;
    } else if (p !== a) {
      return null;
    }
  }
  return Object.freeze(params);
}

function decodificar(segmento: string): string | null {
  try {
    return decodeURIComponent(segmento);
  } catch {
    return null;
  }
}
