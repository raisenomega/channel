#!/usr/bin/env bash
# HUB — dev server (local, hot reload).
# Usa tsx (soporta parameter properties, enums, etc). NO para produccion.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

if [ -f "$PROJECT_DIR/.env.development" ]; then
  set -a; . "$PROJECT_DIR/.env.development"; set +a
fi

echo "[DEV] Iniciando dev server con tsx (hot reload)..."
echo "[DEV] Puerto: ${PORT:-8080}"
pnpm exec tsx watch src/server/hub.server.ts "$@"