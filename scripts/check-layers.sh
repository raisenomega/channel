#!/usr/bin/env bash
# =====================================================================
# Gate de Capas DDD — Cero Tolerancia
# Falla si:
#   A2: domain/ importa de infrastructure/ (ESLint no verifica esto)
#
# NOTA: C1 (any) y C2 (@ts-ignore) se verifican con `pnpm lint`
# via @typescript-eslint/no-explicit-any y @typescript-eslint/ban-ts-comment.
# NO reinventar esa detección en bash — ESLint entiende AST, bash no.
# =====================================================================
set -euo pipefail

FAIL=0
readonly SRC="src"

# ──────────────────────────────────────────────────────────────────
# A2: domain/ NO puede importar de infrastructure/
# ──────────────────────────────────────────────────────────────────
while IFS= read -r -d '' f; do
  if grep -Pn "(from ['\"]\.\.\/infrastructure|from ['\"]\.\.\/\.\.\/infrastructure)" "$f" > /dev/null 2>&1; then
    echo "❌ A2 VIOLATION: $f → importa de infrastructure/ (domain debe ser puro)"
    FAIL=1
  fi
done < <(find "$SRC" -path '*/domain/*' -name '*.ts' -print0 2>/dev/null)

# ──────────────────────────────────────────────────────────────────
# Resultado
# ──────────────────────────────────────────────────────────────────
if [ "$FAIL" -eq 0 ]; then
  echo "✅ Gate A2: 0 violaciones (C1/C2 verificadas por ESLint vía 'pnpm lint')"
  exit 0
else
  echo ""
  echo "❌❌❌ GATE FALLÓ: capa DDD violada."
  exit 1
fi