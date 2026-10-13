#!/usr/bin/env bash
# ====================================================================
# HUB by Raisen — start-server.sh
# Arranca el HTTP server minimo.
#
# Requiere: Node.js >= 22 (con --experimental-strip-types)
# ====================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Cargar variables de entorno si existe .env.development
if [ -f "$PROJECT_DIR/.env.development" ]; then
  set -a
  # shellcheck source=/dev/null
  . "$PROJECT_DIR/.env.development"
  set +a
fi

echo "[HUB] Iniciando server..."
echo "[HUB] Project dir: $PROJECT_DIR"
echo "[HUB] Puerto: ${PORT:-8080}"

cd "$PROJECT_DIR"

node --experimental-strip-types src/server/hub.server.ts "$@"