// HUB by Raisen - configuracion de Vite para el frontend
// Resuelve imports .ts, CSS OMEGA y mapea /src/shared a la carpeta compartida
// del repositorio (fuera del root) para el flujo de auth multi-tenant.
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const webRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: webRoot,
  publicDir: fileURLToPath(new URL("public", import.meta.url)),
  resolve: {
    alias: {
      // dominio compartido del repo -> @shared/... (fuera del root)
      "@shared": fileURLToPath(new URL("src/shared", repoRoot)),
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