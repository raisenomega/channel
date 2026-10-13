#!/usr/bin/env bash
set -euo pipefail
# Gate de emojis — Cero Tolerancia. Falla si encuentra emojis en .ts o .html
# Solo se permiten iconos SVG (Lucide). Prohibidos: emojis Unicode.
FAIL=0
echo "Verificando que no haya emojis en .ts ni .html..."

# Rango de emojis Unicode (versión grep PCRE)
while IFS= read -r -d '' f; do
  if grep -Pn '[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{27BF}]|[\x{2702}-\x{27B0}]|[\x{1F600}-\x{1F64F}]' "$f" > /dev/null 2>&1; then
    echo "❌ EMOJI VIOLATION: $f"
    FAIL=1
  fi
done < <(find src/ ui/ -name '*.ts' -o -name '*.html' -print0 2>/dev/null)

if [ "$FAIL" -eq 0 ]; then
  echo "✅ Gate de emojis: 0 violaciones — Solo SVG Lucide permitido."
  exit 0
else
  echo ""
  echo "❌❌❌ GATE FALLÓ: hay emojis en el código. Solo SVG Lucide."
  echo "   Reemplazar con <svg> Lucide icons."
  exit 1
fi