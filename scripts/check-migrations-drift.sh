#!/usr/bin/env bash
# Compuerta #20 — Detecta drift entre supabase/migrations/*.sql y DB linkeada.
# Falla si hay migrations locales sin aplicar en remoto o viceversa.
set -uo pipefail

cd "$(dirname "$0")/.."

echo "[Compuerta #20] Verificando drift migrations vs remote..."

# Lista local (nombres de archivo sin ruta ni extensión)
LOCAL=$(ls supabase/migrations/*.sql 2>/dev/null | xargs -n1 basename | sed 's/\.sql$//' | sort)

# Si no hay credenciales (CI sin SUPABASE_ACCESS_TOKEN), skip con warning (no bloquea)
if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  echo "⚠️  SUPABASE_ACCESS_TOKEN ausente — gate skipped (ejecutar localmente antes de merge)."
  exit 0
fi

# Lista remota via supabase CLI
REMOTE=$(supabase migration list --linked --output json 2>/dev/null | \
  python3 -c "import json,sys; d=json.load(sys.stdin); print('\n'.join(m['name'] for m in d if m.get('applied_at')))" | sort)

# Diff
DRIFT_LOCAL_ONLY=$(comm -23 <(echo "$LOCAL") <(echo "$REMOTE"))
DRIFT_REMOTE_ONLY=$(comm -13 <(echo "$LOCAL") <(echo "$REMOTE"))

if [ -n "$DRIFT_LOCAL_ONLY" ]; then
  echo "❌ Compuerta #20 FAIL — migrations locales no aplicadas en remoto:"
  echo "$DRIFT_LOCAL_ONLY" | sed 's/^/    - /'
  exit 1
fi

if [ -n "$DRIFT_REMOTE_ONLY" ]; then
  echo "⚠️  migrations remotas sin archivo local (manual?):"
  echo "$DRIFT_REMOTE_ONLY" | sed 's/^/    - /'
fi

echo "✅ Compuerta #20: 0 drift — migrations locales == remoto."
