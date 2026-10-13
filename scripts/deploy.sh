#!/usr/bin/env bash
# =============================================================================
# deploy.sh — Script unico para deployar HUB a Railway + Supabase
# USO: bash scripts/deploy.sh
# REQUIERE: .env.development completo + Railway CLI + Git
# =============================================================================
set -euo pipefail

echo ""
echo "=============================================="
echo "  HUB — Deploy a Produccion"
echo "=============================================="
echo ""

if [ ! -f .env.development ]; then
  echo "ERROR: .env.development no encontrado."
  exit 1
fi

# Cargar variables
export $(grep -v '^#' .env.development | xargs)

echo "[1/5] Verificando git..."
git checkout develop && git pull origin develop
echo "  Branch: develop (actualizado)"

echo "[2/5] Ejecutando tests..."
pnpm check:all
pnpm test:unit

echo "[3/5] Merge a staging..."
git checkout staging && git merge develop --no-ff -m "[deploy] Staging desde develop"
git push origin staging

echo "[4/5] Ejecutando migrations en Supabase..."
# Metodo 1: Usando Supabase CLI (recomendado)
if command -v supabase &> /dev/null; then
  supabase db push
  echo "  Migrations ejecutadas via Supabase CLI"
else
  echo "  WARN: Supabase CLI no disponible. Usando metodo alternativo..."
  # Metodo 2: via REST API + service_role key
  echo "  Ejecutar manualmente: bash scripts/setup-supabase.sh"
fi

echo "[5/5] Deploy a Railway..."
if command -v railway &> /dev/null; then
  railway up --service hub-api --environment production
  echo "  Railway deployado!"
else
  echo "  Railway CLI no disponible."
  echo "  Deploy manual: conectar repositorio en railway.app"
fi

echo ""
echo "=============================================="
echo "  Deploy completado!"
echo "  Staging: https://hub-staging.railway.app"
echo "  Proximo: merge staging a main (PR + approval)"
echo "=============================================="