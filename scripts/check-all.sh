#!/usr/bin/env bash
# =====================================================================
# META-GATE: ejecuta TODOS los gates. Si UNO falla → NO PASA.
# =====================================================================
set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FAIL=0

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  HUB — META-GATE DE CALIDAD"
echo "  $(date)"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ── Gate 1: líneas ──────────────────────────────────────────────
echo "[1/4] Gate de 75 líneas (C4)..."
if bash "$SCRIPT_DIR/check-lines.sh"; then
  echo "  ✅ Gate 1 pasa"
else
  echo "  ❌ Gate 1 FALLA"
  FAIL=1
fi
echo ""

# ── Gate 2: capas DDD ──────────────────────────────────────────
echo "[2/4] Gate de capas DDD (A2, C1, C2)..."
if bash "$SCRIPT_DIR/check-layers.sh"; then
  echo "  ✅ Gate 2 pasa"
else
  echo "  ❌ Gate 2 FALLA"
  FAIL=1
fi
echo ""

# ── Gate 3: typecheck ──────────────────────────────────────────
echo "[3/4] TypeScript strict check..."
if command -v pnpm &> /dev/null; then
  if pnpm typecheck 2>&1; then
    echo "  ✅ Gate 3 pasa"
  else
    echo "  ❌ Gate 3 FALLA"
    FAIL=1
  fi
else
  echo "  ⚠️  pnpm no disponible — saltando typecheck"
fi
echo ""

# ── Gate 4: lint ──────────────────────────────────────────────
echo "[4/4] Lint..."
if command -v pnpm &> /dev/null; then
  if pnpm lint 2>&1; then
    echo "  ✅ Gate 4 pasa"
  else
    echo "  ❌ Gate 4 FALLA"
    FAIL=1
  fi
else
  echo "  ⚠️  pnpm no disponible — saltando lint"
fi
echo ""

# ── Resultado final ────────────────────────────────────────────
echo "═══════════════════════════════════════════════════════════════"
if [ "$FAIL" -eq 0 ]; then
  echo "  ✅ META-GATE: TODOS los gates pasan — Código listo."
  echo "═══════════════════════════════════════════════════════════════"
  exit 0
else
  echo "  ❌❌❌ META-GATE FALLÓ: hay violaciones que corregir."
  echo "  NO se puede mergear ni continuar a la siguiente sesión."
  echo "═══════════════════════════════════════════════════════════════"
  exit 1
fi