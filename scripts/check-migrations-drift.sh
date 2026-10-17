#!/usr/bin/env bash
# Compuerta #20 — Detecta drift entre supabase/migrations/*.sql y la DB linkeada.
#
# H4 (2026-10-17) — CERO skip silencioso. Raíz del drift que llegó a prod:
# este gate hacía `exit 0` cuando faltaba SUPABASE_ACCESS_TOKEN, así que en CI
# (Hotfix I/J/K/L) nunca verificó y 024-035 pasaron sin detectarse.
# Ahora, si NO se puede verificar:
#   - en CI (CI=true)  -> exit 1 HARD-FAIL (el secret DEBE estar montado).
#   - en LOCAL          -> skip con warning ruidoso (el dev no tiene el token de
#                          prod; la verificación real y bloqueante corre en CI).
# Cualquier fallo al obtener el estado remoto también es hard-fail (no se asume
# "sin drift" cuando no se pudo mirar).
set -uo pipefail

cd "$(dirname "$0")/.."

echo "[Compuerta #20] Verificando drift migrations vs remote..."

# Lista local (nombres de archivo sin ruta ni extensión)
LOCAL=$(ls supabase/migrations/*.sql 2>/dev/null | xargs -n1 basename | sed 's/\.sql$//' | sort)

if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  if [ "${CI:-false}" = "true" ]; then
    echo "❌ Compuerta #20 FAIL (CI) — SUPABASE_ACCESS_TOKEN ausente: no se puede verificar drift."
    echo "   Montar el secret en el job de CI. H4: cero skip silencioso en CI."
    exit 1
  fi
  echo "⚠️  Compuerta #20 — SUPABASE_ACCESS_TOKEN ausente en entorno LOCAL: gate diferido a CI."
  echo "   (En CI este gate hace HARD-FAIL si el secret falta; localmente no bloquea el push.)"
  exit 0
fi

# Lista remota via supabase CLI. Si el comando falla, es "no se pudo verificar" -> hard-fail.
REMOTE_RAW=$(supabase migration list --linked --output json 2>/dev/null) || {
  echo "❌ Compuerta #20 FAIL — 'supabase migration list' falló: no se pudo obtener el estado remoto."
  echo "   H4: si no se puede verificar, se FALLA (no se asume 0 drift)."
  exit 1
}
if [ -z "$REMOTE_RAW" ]; then
  echo "❌ Compuerta #20 FAIL — estado remoto vacío: no se pudo verificar drift."
  exit 1
fi

REMOTE=$(printf '%s' "$REMOTE_RAW" | python3 -c "import json,sys; d=json.load(sys.stdin); print('\n'.join(m['name'] for m in d if m.get('applied_at')))" | sort) || {
  echo "❌ Compuerta #20 FAIL — no se pudo parsear la respuesta de 'supabase migration list'."
  exit 1
}

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
