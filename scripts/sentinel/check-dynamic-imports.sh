#!/usr/bin/env bash
# Bloque E: bloquea dynamic imports cross-layer (DDD).
# Reglas:
#   - domain NO importa de application/infrastructure/presentation
#   - application NO importa de infrastructure/presentation
#   - presentation NO importa de infrastructure (debe ir via application)
#   - Static import (check:layers lo verifica)
#   - Dynamic (await import, require) también verificar aquí
set -uo pipefail

FAIL=0

# Buscar `await import(` o `require(` con paths relativos cross-layer
VIOLATIONS=$(grep -rnE '(await\s+import|require)\s*\(\s*["\x27]\.\./(infrastructure|domain|presentation|application)' \
  src/ 2>/dev/null \
  | grep -vE '\.test\.ts|_test\.ts' \
  | grep -vE '//.*sentinel-allow' \
  || true)

if [ -n "$VIOLATIONS" ]; then
  echo "  ✗ dynamic import cross-layer detectado:"
  echo "$VIOLATIONS" | sed 's/^/      /'
  echo ""
  echo "    DDD prohíbe que presentation importe de infrastructure (y variantes)."
  echo "    El dynamic import NO es un workaround válido — es la misma violación."
  echo "    Mueve el archivo a la capa correcta o pasa la dependencia por constructor."
  FAIL=1
else
  echo "  ✓ ningún dynamic import cross-layer"
fi

exit $FAIL
