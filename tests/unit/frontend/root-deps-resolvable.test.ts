/**
 * HUB by Raisen — Guardia L-SEV-1 (leccion K-SEV-1, tercera vez no).
 * Los tests del root corren con el `pnpm install` del ROOT: toda dependencia
 * que alcance un test desde apps/tanstack/src TIENE que resolverse en
 * <repo>/node_modules. Si alguien agrega una dep al frontend y la usa en un
 * componente que un test renderiza sin anadirla a root devDependencies, este
 * test falla con nombre y apellido en vez de un "Failed to resolve import"
 * que solo aparece en el container del auditor.
 */
import { createRequire } from "node:module";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

// En jsdom `import.meta.url` es http (vitest sirve los modulos): el ancla es cwd,
// que vitest fija en la raiz del repo.
const RAIZ = process.cwd();
const requireRaiz = createRequire(join(RAIZ, "package.json"));
const NODE_MODULES_RAIZ = join(RAIZ, "node_modules").replace(/\\/g, "/");

/** Paquetes que los tests del root alcanzan al renderizar rutas del frontend. */
const PAQUETES = [
  "react",
  "react-dom",
  "@testing-library/react",
  "@tanstack/react-router",
  "@tanstack/react-query",
  "@supabase/supabase-js",
  "clsx",
  "tailwind-merge",
] as const;

describe("L-SEV-1 deps del frontend resolubles desde el ROOT", () => {
  for (const p of PAQUETES) {
    test(`${p} resuelve en <repo>/node_modules (no en apps/tanstack/node_modules)`, () => {
      const resuelto = requireRaiz.resolve(p).replace(/\\/g, "/");
      expect(resuelto.startsWith(NODE_MODULES_RAIZ)).toBe(true);
    });
  }
});
