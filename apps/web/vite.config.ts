// HUB by Raisen - configuracion de Vite para el frontend
// Resuelve imports .ts, CSS OMEGA y el alias @shared -> carpeta compartida
// del repositorio (fuera del root) para el flujo de auth multi-tenant.
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { join, normalize } from "node:path";

const webRoot = fileURLToPath(new URL(".", import.meta.url)); // apps/web/
const repoRoot = normalize(join(webRoot, "../..")); // raiz del repo
const sharedDir = normalize(join(repoRoot, "src", "shared")); // raiz/src/shared

export default defineConfig({
  root: webRoot,
  publicDir: fileURLToPath(new URL("public", import.meta.url)),
  resolve: {
    alias: {
      // dominio compartido del repo -> @shared/...
      "@shared": sharedDir,
    },
  },
  server: {
    port: 5174,
    strictPort: false,
    // permitir servir archivos fuera del root (carpeta compartida del repo)
    fs: { allow: [repoRoot, webRoot] },
  },
  build: {
    outDir: fileURLToPath(new URL("dist", import.meta.url)),
    emptyOutDir: true,
  },
});