#!/usr/bin/env bash
# Gate de capas DDD — Verifica que domain/ no importe de infrastructure/
FAIL=0
# Buscar imports de infrastructure en domain/
for f in $(find src/ -path '*/domain/*' -name '*.ts'); do
  if grep -E "from ['\"]\.\./infrastructure|from ['\"]\.\./\.\./infrastructure" "$f" > /dev/null 2>&1; then
    echo "❌ $f: importa de infrastructure/ (violación A2)"
    FAIL=1
  fi
done
# Buscar imports de domain en infrastructure/ (permitido)
# Buscar any en todo src/
for f in $(find src/ -name '*.ts'); do
  if grep -E '\bany\b' "$f" > /dev/null 2>&1; then
    echo "❌ $f: contiene 'any' (violación C1)"
    FAIL=1
  fi
done
if [ "$FAIL" -eq 0 ]; then
  echo "✅ Gate de capas DDD: 0 violaciones"
fi
exit $FAIL