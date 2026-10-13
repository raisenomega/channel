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

echo "[1/3] Ejecutando reset completo (borra esquema y re-aplica)..."
supabase db reset --linked

echo "[2/3] Verificando migraciones..."
supabase migration list 2>/dev/null || true

echo "[3/3] Listo."
echo ""

echo "=============================================="
echo "  Base de datos de desarrollo lista!"
echo "  Host: $(grep -m1 '^host' supabase/config.toml 2>/dev/null || echo 'local')"
echo "=============================================="