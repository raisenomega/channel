#!/usr/bin/env bash
# HUB — start server (produccion).
# Corre dist/*.js compilado por scripts/build.sh.
# NO usa --experimental-strip-types (que no soporta parameter properties DDD).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

if [ -f "$PROJECT_DIR/.env.development" ]; then
  set -a; . "$PROJECT_DIR/.env.development"; set +a
fi

if [ ! -f "$PROJECT_DIR/dist/server/hub.server.js" ]; then
  echo "[HUB] ERROR: dist/server/hub.server.js no existe. Corre 'pnpm build' primero."
  exit 1
fi

echo "[HUB] Iniciando server..."
echo "[HUB] Project dir: $PROJECT_DIR"
echo "[HUB] Puerto: ${PORT:-8080}"
node dist/server/hub.server.js "$@"