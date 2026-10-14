#!/usr/bin/env bash
# Bloque C: detecta verificaciones de seguridad opcionales (bypasseables).
# Patrón: if (sig/signature/token/verifier/csrf/hmac/state) { ...verify... }
# En cualquier archivo bajo src/*/presentation/ o src/server/.
set -uo pipefail

FAIL=0

# Regex: busca "if (" seguido de un identificador de seguridad y cierre de )
# que inmediatamente envuelve una verificación. Solo en rutas / handlers.
PATHS="src/*/presentation/routes src/server src/channels/*/presentation"

# Patrón 1: if (sig) o if (token) etc. seguido de verify/check en 3 líneas
BAD=$(grep -rnE 'if\s*\(\s*(sig|signature|token|verifier|csrf|hmac|state|firma)\s*\)' \
  src/ 2>/dev/null \
  | grep -vE '\.test\.ts|_test\.ts|__tests__' \
  | grep -vE '//.*(sentinel-allow|intentional)' \
  || true)

if [ -n "$BAD" ]; then
  echo "  ✗ verificación de seguridad opcional detectada:"
  echo "$BAD" | sed 's/^/      /'
  echo ""
  echo "    En bank-grade, controles de seguridad son MANDATORIOS."
  echo "    Un 'if (sig)' permite bypass omitiendo el parámetro."
  echo "    Patrón correcto:"
  echo "      if (!sig) return err({ kind: 'firma_requerida' });"
  echo "      // ...luego verificar..."
  echo ""
  echo "    Si es intencional (ej: fallback a otra auth), agrega al final"
  echo "    de la línea: // sentinel-allow: <razón>"
  FAIL=1
else
  echo "  ✓ ninguna verificación de seguridad opcional detectada"
fi

exit $FAIL
