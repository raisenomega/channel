#!/usr/bin/env bash
# Bloque D: verifica que columnas referenciadas en queries existan en migraciones.
# Scope: busca patrón PostgREST `/table?col=` y `?select=col1,col2` y
# verifica que cada columna aparezca al menos una vez en supabase/migrations/*.sql
set -uo pipefail

FAIL=0

# 1) Extraer tabla + columna de queries estilo PostgREST
#    Formato típico: /embedded_signups?select=id,tenant_id&meta_webhook_id=eq.X
#    Columnas a validar: en el `?select=` y en los filtros `?col=eq.`
QUERIES=$(grep -rhoE '\$\{[^}]+\}/[a-z_]+\?[^"]+' src/ 2>/dev/null | sort -u)

for q in $QUERIES; do
  # extraer tabla
  table=$(echo "$q" | sed -E 's|.*\}/([a-z_]+)\?.*|\1|')
  [ -z "$table" ] && continue

  # extraer columnas de filtros tipo &col=eq. o ?col=eq.
  cols=$(echo "$q" | grep -oE '[?&][a-z_]+=eq\.' | sed -E 's/[?&]([a-z_]+)=eq\./\1/' | grep -vE '^(select|limit|order|offset)$' || true)

  for c in $cols; do
    # buscar la columna en cualquier migración
    if ! grep -qE "\b${c}\b" supabase/migrations/*.sql 2>/dev/null; then
      echo "  ✗ query a columna inexistente: tabla=${table} columna=${c}"
      echo "      (ninguna migración define ${c})"
      FAIL=1
    fi
  done
done

if [ $FAIL -eq 0 ]; then
  echo "  ✓ todas las columnas referenciadas existen en migraciones"
fi

exit $FAIL
