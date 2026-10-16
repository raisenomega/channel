#!/usr/bin/env bash
# HUB — compuerta "server-smoke" (Sentinela).
# Verifica que `pnpm start` arranca sin crashear por al menos 3 segundos.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

if [ ! -f "$PROJECT_DIR/dist/server/hub.server.js" ]; then
  echo "[SMOKE] ERROR: dist/ no existe. Corre 'pnpm build' primero."
  exit 1
fi

echo "[SMOKE] Arrancando server por 3 segundos..."

export NODE_ENV=test
export PORT=18080
export SUPABASE_URL="https://test.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="test-key"
export SUPABASE_JWT_SECRET="smoke-test-secret"
export STRIPE_SECRET_KEY="sk_test_smoke"
export STRIPE_WEBHOOK_SECRET="whsec_smoke"
export STRIPE_API_VERSION="2024-10-28.acacia"
export ATH_MOVIL_STUB="1"
export CSRF_SECRET=$(openssl rand -hex 32)
export HUB_PUBLIC_URL="http://localhost:18080"

node dist/server/hub.server.js &
SERVER_PID=$!

sleep 3

if kill -0 $SERVER_PID 2>/dev/null; then
  echo "[SMOKE] Server arranco y sigue vivo tras 3s"
  kill $SERVER_PID 2>/dev/null || true
  wait $SERVER_PID 2>/dev/null || true
  exit 0
else
  echo "[SMOKE] Server crasheo dentro de 3s de arrancar"
  echo "[SMOKE] Esto indica regresion como parameter properties en strip-types mode"
  exit 1
fi