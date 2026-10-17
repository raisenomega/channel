#!/usr/bin/env bash
# Compuerta #20 — Detecta drift entre supabase/migrations/*.sql y la DB de prod.
#
# H4 (2026-10-17) — CERO skip silencioso.
# Camino B (Management API): lista las migraciones aplicadas vía
#   GET https://api.supabase.com/v1/projects/<ref>/database/migrations
#   Authorization: Bearer $SUPABASE_ACCESS_TOKEN
# Solo necesita el access token (ya montado en CI). SIN supabase CLI, SIN link,
# SIN config.toml en el runner, SIN DB password (menor privilegio).
#
# Comportamiento:
#   - sin token + CI       -> exit 1 HARD-FAIL (el secret DEBE estar montado).
#   - sin token + local     -> skip con warning ruidoso (no brickea pre-push).
#   - API 4xx/5xx o malformed -> exit 1 (no se asume 0 drift sin verificar).
#   - drift (local no aplicada) -> exit 1.
set -uo pipefail

cd "$(dirname "$0")/.."

REF="${SUPABASE_PROJECT_REF:-qbpzdoopruqbnerdcyfq}"
API="https://api.supabase.com/v1/projects/${REF}/database/migrations"

echo "[Compuerta #20] Verificando drift migrations vs prod (Management API)..."

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

# Llamada a la Management API (captura cuerpo + status por separado).
HTTP_BODY=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" -H "Accept: application/json" "$API") || {
  echo "❌ Compuerta #20 FAIL — curl a la Management API falló (red)."; exit 1;
}
STATUS=$(printf '%s' "$HTTP_BODY" | tail -n1)
JSON=$(printf '%s' "$HTTP_BODY" | sed '$d')
if [ "$STATUS" != "200" ]; then
  echo "❌ Compuerta #20 FAIL — Management API respondió HTTP ${STATUS} (no se pudo verificar)."
  echo "   Verificar que SUPABASE_ACCESS_TOKEN sea válido y con acceso al proyecto ${REF}."
  exit 1
fi

# Set de identificadores aplicados: tolerante a la forma (array u objeto envolvente;
# campos 'version' y/o 'name'). Imprime cada token en su propia línea.
REMOTE=$(printf '%s' "$JSON" | python3 -c '
import json, sys
try:
    d = json.load(sys.stdin)
except Exception as e:
    sys.stderr.write("parse_error: %s\n" % e); sys.exit(3)
rows = d if isinstance(d, list) else (d.get("migrations") or d.get("data") or [])
out = set()
for r in rows:
    if not isinstance(r, dict):
        continue
    for k in ("version", "name"):
        v = r.get(k)
        if v:
            out.add(str(v))
print("\n".join(sorted(out)))
') || { echo "❌ Compuerta #20 FAIL — respuesta de la Management API no parseable/forma inesperada."; exit 1; }

if [ -z "$REMOTE" ]; then
  echo "❌ Compuerta #20 FAIL — la Management API no devolvió migraciones (forma inesperada o vacía)."
  exit 1
fi

# Una migración local NNN_slug cuenta como aplicada si su nombre COMPLETO o su
# prefijo numérico (NNN) aparece en el set remoto (Supabase guarda 'version'=prefijo).
DRIFT=""
while IFS= read -r m; do
  [ -z "$m" ] && continue
  prefix="${m%%_*}"
  if printf '%s\n' "$REMOTE" | grep -qxF "$m"; then continue; fi
  if printf '%s\n' "$REMOTE" | grep -qxF "$prefix"; then continue; fi
  DRIFT="${DRIFT}    - ${m}\n"
done <<< "$LOCAL"

if [ -n "$DRIFT" ]; then
  echo "❌ Compuerta #20 FAIL — migraciones locales NO aplicadas en prod:"
  printf "%b" "$DRIFT"
  exit 1
fi

echo "✅ Compuerta #20: 0 drift — migraciones locales == prod (Management API)."
