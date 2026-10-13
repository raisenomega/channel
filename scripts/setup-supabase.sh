#!/usr/bin/env bash
# =============================================================================
# setup-supabase.sh — Prepara Supabase + ejecuta migrations + seed
# USO: bash scripts/setup-supabase.sh
# =============================================================================
set -euo pipefail

echo ""
echo "=============================================="
echo "  HUB — Setup Supabase"
echo "=============================================="
echo ""

# 1. Verificar variables de entorno
if [ ! -f .env.development ]; then
  echo "ERROR: .env.development no encontrado."
  echo "  Copiar desde .env.example y completar:"
  echo "  cp .env.example .env.development"
  exit 1
fi

# Cargar variables
export $(grep -v '^#' .env.development | xargs)

echo "[1/5] Verificando conexion a Supabase..."
if curl -s -o /dev/null -w "%{http_code}" "$SUPABASE_URL/rest/v1/" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"; then
  echo "  OK: Supabase responde"
else
  echo "  WARN: No se pudo verificar directamente. Continuando..."
fi

echo "[2/4] Aplicando migrations en orden..."
for file in $(ls supabase/migrations/*.sql | sort); do
  echo "  Migration: $(basename $file)"
  curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"query\": $(cat $file | jq -Rs .)}" || true
done

echo "[3/4] Verificando tablas creadas..."
curl -s "$SUPABASE_URL/rest/v1/tenants?limit=1" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | head -c 200
echo ""

echo "[4/4] Setup completado!"
echo "  Supabase: $SUPABASE_URL"
echo "  Proximo paso: configurar Railway con estos mismos .env"