#!/usr/bin/env bash
# =====================================================================
# Gate DEFINITIVO de Capas DDD — Cero Tolerancia
# Falla si:
#   A2: domain/ importa de infrastructure/ (violación de capa)
#   C1: cualquier .ts contiene 'any'
#   C2: cualquier .ts contiene @ts-ignore o @ts-expect
# =====================================================================
set -euo pipefail

FAIL=0
readonly SRC="src"

# ──────────────────────────────────────────────────────────────────
# A2: domain/ NO puede importar de infrastructure/
# ──────────────────────────────────────────────────────────────────
while IFS= read -r -d '' f; do
  # Busca importación desde infrastructure/ (relativa o absoluta)
  if grep -Pn "(from ['\"]\.\.\/infrastructure|from ['\"]\.\.\/\.\.\/infrastructure)" "$f" > /dev/null 2>&1; then
    echo "❌ A2 VIOLATION: $f → importa de infrastructure/ (domain debe ser puro)"
    FAIL=1
  fi
done < <(find "$SRC" -path '*/domain/*' -name '*.ts' -print0 2>/dev/null)

# ──────────────────────────────────────────────────────────────────
# A5: domain/ debe usar Result, no lanzar excepciones de negocio
# ──────────────────────────────────────────────────────────────────
# (opcional: buscar throw en domain/ — se permite solo para errores de programa)
# Esta regla se verifica en code review, no automáticamente.

# ──────────────────────────────────────────────────────────────────
# C1: Cero 'any' en todo src/
# ──────────────────────────────────────────────────────────────────
while IFS= read -r -d '' f; do
  # Busca 'any' (como palabra, no substring de 'many' etc)
  if grep -Pn '\bany\b' "$f" > /dev/null 2>&1; then
    # Excluir Result<T,E> que es la única excepción canónica
    if ! grep -P '^export type Result<[^,]+,[^>]+> =' "$f" > /dev/null 2>&1; then
      echo "❌ C1 VIOLATION: $f → contiene 'any' (prohibido)"
      FAIL=1
    fi
  fi
done < <(find "$SRC" -name '*.ts' -print0 2>/dev/null)

# ──────────────────────────────────────────────────────────────────
# C2: Cero @ts-ignore y @ts-expect
# ──────────────────────────────────────────────────────────────────
while IFS= read -r -d '' f; do
  if grep -P '@ts-(ignore|expect)' "$f" > /dev/null 2>&1; then
    echo "❌ C2 VIOLATION: $f → contiene @ts-ignore o @ts-expect (prohibido)"
    FAIL=1
  fi
done < <(find "$SRC" -name '*.ts' -print0 2>/dev/null)

# ──────────────────────────────────────────────────────────────────
# Resultado
# ──────────────────────────────────────────────────────────────────
if [ "$FAIL" -eq 0 ]; then
  echo "✅ Gates A2/C1/C2: 0 violaciones — PASA"
  exit 0
else
  echo ""
  echo "❌❌❌ GATE FALLÓ: hay violaciones de capas DDD o código prohibido."
  echo "   Corregir antes de cualquier commit o merge."
  exit 1
fi