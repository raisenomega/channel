#!/usr/bin/env bash
# HUB — build para produccion.
# Compila src/**/*.ts -> dist/**/*.js para que Node ejecute JS puro sin
# depender de --experimental-strip-types (que no soporta parameter properties).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

echo "[BUILD] Limpiando dist/ anterior..."
rm -rf dist/

echo "[BUILD] Compilando TypeScript..."
pnpm exec tsc --project tsconfig.build.json

if [ ! -f "dist/server/hub.server.js" ]; then
  echo "[BUILD] ERROR: dist/server/hub.server.js no se genero"
  exit 1
fi

echo "[BUILD] Compilacion exitosa --- dist/ listo"