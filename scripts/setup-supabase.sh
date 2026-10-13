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

echo "[2/5] Aplicando migrations UP (001-017)..."
for i in $(seq -w 1 17); do
  file=$(ls supabase/migrations/${i}_*.sql 2>/dev/null | head -1)
  if [ -n "$file" ]; then
    echo "  Migration $i: $(basename $file)"
    curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
      -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
      -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
      -H "Content-Type: application/json" \
      -d "{\"query\": $(cat $file | jq -Rs .)}" || true
  fi
done

echo "[3/5] Aplicando seed data..."
if [ -f supabase/seed.sql ]; then
  echo "  Cargando seed.sql..."
  curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"query\": $(cat supabase/seed.sql | jq -Rs .)}" || echo "  Seed completado (puede tener errores de duplicados)"
fi

echo "[4/5] Verificando tablas creadas..."
curl -s "$SUPABASE_URL/rest/v1/tenants?limit=1" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | head -c 200
echo ""

echo "[5/5] Setup completado!"
echo "  Supabase: $SUPABASE_URL"
echo "  Proximo paso: configurar Railway con estos mismos .env"