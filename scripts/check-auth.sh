#!/usr/bin/env bash
set -euo pipefail
# Compuerta #17 — Gate de autenticacion por handler HTTP (Hotfix F-urgente).
# Regla: todo archivo *.routes.ts bajo src/ debe
#   (a) llamar requireTenantAuth( o parsearJwtClaims(  -> handler autenticado, o
#   (b) declarar "// PUBLIC: <razon>" explicando por que NO exige JWT
#       (webhooks con HMAC, landing /pay con CSRF+rate-limit, callbacks OAuth con state).
# Granularidad: por archivo (grep). Un archivo que mezcle rutas publicas y privadas
# debe llevar el marcador PUBLIC Y la llamada de auth; el reviewer valida la razon.
FAIL=0
TOTAL=0
echo "Compuerta #17: verificando auth en handlers *.routes.ts bajo src/..."
while IFS= read -r -d '' f; do
  TOTAL=$((TOTAL + 1))
  if grep -qE 'requireTenantAuth\(|parsearJwtClaims\(' "$f"; then
    echo "  AUTH    $f"
    continue
  fi
  if grep -qE '//[[:space:]]*PUBLIC:[[:space:]]*[^[:space:]]' "$f"; then
    echo "  PUBLIC  $f"
    continue
  fi
  echo "  FALTA   $f  (ni requireTenantAuth/parsearJwtClaims ni '// PUBLIC: <razon>')"
  FAIL=1
done < <(find src -type f -name '*.routes.ts' -print0 | sort -z)

if [ "$FAIL" -eq 0 ]; then
  echo "OK Gate auth (Compuerta #17): $TOTAL archivos de rutas, 0 handlers sin compuerta."
  exit 0
fi
echo ""
echo "GATE AUTH FALLO: hay handlers sin JWT ni '// PUBLIC: <razon>'."
echo "   Compuerta #17: cada handler nuevo DEBE autenticar o declararse PUBLIC con razon."
exit 1
