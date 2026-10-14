/**
 * HUB by Raisen — Polyfill minimo de Deno.env para Node.js.
 */

import * as nodeProcess from "node:process";

if (typeof (globalThis as Record<string, unknown>).Deno === "undefined") {
  (globalThis as Record<string, unknown>).Deno = {
    env: {
      get(name: string): string | undefined {
        return nodeProcess.env[name] ?? undefined;
      },
    },
    exit(code?: number): never {
      nodeProcess.exit(code ?? 0);
    },
  };
}