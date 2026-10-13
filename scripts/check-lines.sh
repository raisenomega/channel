#!/usr/bin/env bash
# =====================================================================
# Gate DEFINITIVO de 75 líneas — Cero Tolerancia (C4)
# Falla si ALGÚN archivo .ts supera las 75 líneas, sin excepción.
# =====================================================================
set -euo pipefail

readonly MAX=75
FAIL=0

while IFS= read -r -d '' f; do
  lines=$(wc -l < "$f")
  if [ "$lines" -gt "$MAX" ]; then
    echo "❌ C4 VIOLATION: $f → $lines líneas (máx $MAX)"
    FAIL=1
  fi
done < <(find src/ -name '*.ts' -print0 2>/dev/null)

if [ "$FAIL" -eq 0 ]; then
  echo "✅ Gate C4 (≤$MAX líneas): 0 violaciones — PASA"
else
  echo ""
  echo "❌❌❌ GATE FALLÓ: hay archivos que exceden $MAX líneas."
  echo "   Corregir antes de cualquier commit o merge."
  exit 1
fi

exit 0