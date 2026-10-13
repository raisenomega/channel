#!/usr/bin/env bash
# Gate de 75 líneas — Falla si algún archivo .ts supera las 75 líneas
MAX=75
FAIL=0
while IFS= read -r -d '' f; do
  lines=$(wc -l < "$f")
  if [ "$lines" -gt "$MAX" ]; then
    echo "❌ $f: $lines líneas (máx $MAX)"
    FAIL=1
  fi
done < <(find src/ -name '*.ts' -print0)
if [ "$FAIL" -eq 0 ]; then
  echo "✅ Gate de $MAX líneas: 0 violaciones"
fi
exit $FAIL