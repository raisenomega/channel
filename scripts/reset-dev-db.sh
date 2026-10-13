#!/usr/bin/env bash
# =============================================================================
# reset-dev-db.sh — Reinicia la base de datos de desarrollo desde 0
# USO: ./scripts/reset-dev-db.sh
# REQUIERE: supabase CLI instalado y proyecto linkeado
#   npm install -g supabase
#   supabase login
#   supabase link --project-ref <PROJECT_REF>
# =============================================================================
set -euo pipefail

echo ""
echo "=============================================="
echo "  HUB — Reset de Base de Datos de Desarrollo"
echo "=============================================="
echo ""

# Verificar que supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
  echo "ERROR: Supabase CLI no encontrado."
  echo "  Instalar: npm install -g supabase"
  exit 1
fi

# Verificar que estamos en el proyecto correcto
if [ ! -f "supabase/config.toml" ]; then
  echo "ERROR: No se encuentra supabase/config.toml"
  echo "  Ejecutar desde la raiz del proyecto HUB"
  exit 1
fi

echo "[1/4] Ejecutando rollback completo..."
for i in $(seq 17 -1 1); do
  file=$(printf "supabase/migrations/%03d_*.down.sql" $i)
  if ls $file 1> /dev/null 2>&1; then
    echo "  Aplicando rollback: $(ls $file)"
    supabase db execute --file $(ls $file) 2>/dev/null || true
  fi
done

echo "[2/4] Ejecutando migrations (UP)..."
supabase db push

echo "[3/4] Cargando seed data..."
supabase db execute --file supabase/seed.sql 2>/dev/null || {
  echo "  NOTA: Seed data parcial. Crear auth user manualmente despues."
  echo "  Ejecutar: supabase auth signup --email admin@saborcriollo.com --password test123"
}

echo "[4/4] Verificando... (opcional, requiere psql)"
echo "  Para verificar: supabase db dump | head -50"
echo ""

echo "=============================================="
echo "  Base de datos de desarrollo lista!"
echo "  Host: $(grep -m1 '^host' supabase/config.toml 2>/dev/null || echo 'local')"
echo "=============================================="