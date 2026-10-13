#!/usr/bin/env bash
# =====================================================================
# GATE GRADO BANCARIO — Protocolo P1 duro (auditoria grado bancario)
# Extiende check-all.sh sumando el frontend apps/web a los mismos
# criterios (typecheck + lint). Si UNO falla, la sesion NO cierra.
#
# Referencia: meta/auditoria.grado-bancario.meta.md
# =====================================================================
set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FAIL=0

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  HUB — GATE GRADO BANCARIO (P1 duro)"
echo "  $(date)"
echo "═══════════════════════════════════════════════════════════════"
echo ""

step() { echo "[$1/$TOTAL] $2"; }

TOTAL=6

# ── Gate 1: líneas (C4) ─────────────────────────────────────────
step 1 "Gate 75 líneas (C4, backend)"
bash "$SCRIPT_DIR/check-lines.sh" > /tmp/gb_lines.$$ 2>&1 && echo "  ✅ C4 (back)" || { tail -3 /tmp/gb_lines.$$; FAIL=1; }
rm -f /tmp/gb_lines.$$

# ── Gate 2: capas DDD / any / ts-ignore (A2, C1, C2) ────────────
step 2 "Gate capas DDD (A2, C1, C2)"
bash "$SCRIPT_DIR/check-layers.sh" > /tmp/gb_layers.$$ 2>&1 && echo "  ✅ Capas" || { tail -3 /tmp/gb_layers.$$; FAIL=1; }
rm -f /tmp/gb_layers.$$

# ── Gate 3: emojis (E0) ─────────────────────────────────────────
step 3 "Gate emojis (E0)"
bash "$SCRIPT_DIR/check-emojis.sh" > /tmp/gb_emoji.$$ 2>&1 && echo "  ✅ E0" || { tail -3 /tmp/gb_emoji.$$; FAIL=1; }
rm -f /tmp/gb_emoji.$$

# ── Gate 4: typecheck backend + frontend (C3) ───────────────────
step 4 "TypeScript strict (backend + frontend)"
if command -v pnpm &> /dev/null; then
  pnpm typecheck > /tmp/gb_tc.$$ 2>&1 && echo "  ✅ typecheck back" || { tail -5 /tmp/gb_tc.$$; FAIL=1; }
  rm -f /tmp/gb_tc.$$
  # Frontend: chequeo dedicado (tsc con config minima para apps/web/src/*.ts)
  if [ -d apps/web/src ]; then
    cat > .gb-tsconfig.json <<'EOF'
{"compilerOptions":{"target":"ES2022","module":"ESNext","moduleResolution":"bundler","strict":true,"noUncheckedIndexedAccess":true,"skipLibCheck":true,"lib":["ES2022","DOM"],"allowImportingTsExtensions":true,"noEmit":true,"types":[],"baseUrl":".","paths":{"@shared/*":["src/shared/*"]}},"include":["apps/web/src/**/*.ts"]}
EOF
    if npx tsc --noEmit -p .gb-tsconfig.json > /tmp/gb_tcf.$$ 2>&1; then
      echo "  ✅ typecheck front"
    else
      tail -8 /tmp/gb_tcf.$$
      FAIL=1
    fi
    rm -f /tmp/gb_tcf.$$
    rm -f .gb-tsconfig.json
  fi
else
  echo "  ⚠️  pnpm no disponible — saltando typecheck"
fi

# ── Gate 5: lint backend + frontend ─────────────────────────────
step 5 "Lint (backend + frontend)"
if command -v pnpm &> /dev/null; then
  pnpm lint > /tmp/gb_lint.$$ 2>&1 && echo "  ✅ lint back" || { tail -5 /tmp/gb_lint.$$; FAIL=1; }
  rm -f /tmp/gb_lint.$$
  if [ -d apps/web/src ]; then
    npx eslint apps/web/src/ > /tmp/gb_lintf.$$ 2>&1 && echo "  ✅ lint front" || { tail -8 /tmp/gb_lintf.$$; FAIL=1; }
    rm -f /tmp/gb_lintf.$$
  fi
else
  echo "  ⚠️  pnpm no disponible — saltando lint"
fi

# ── Gate 6: RLS + N5 (estático) ─────────────────────────────────
step 6 "RLS en tablas + sin seed ficticio"
rls_count=$(grep -rE "ENABLE ROW LEVEL SECURITY" supabase/migrations/ 2>/dev/null | wc -l)
echo "  Tablas con RLS habilitado: $rls_count"
if find . -path ./node_modules -prune -o -iname "seed*.sql" -print 2>/dev/null | grep -q .; then
  echo "  ⚠️  seed.sql detectado — revisar N5"
else
  echo "  ✅ N5: sin seed.sql"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
if [ "$FAIL" -eq 0 ]; then
  echo "  ✅ GRADO BANCARIO: TODOS los gates pasan — sesión lista para cerrar."
  echo "═══════════════════════════════════════════════════════════════"
  exit 0
else
  echo "  ❌❌❌ GRADO BANCARIO FALLÓ — corregir sin parches y re-ejecutar."
  echo "  NO cerrar la sesión ni iniciar la siguiente."
  echo "═══════════════════════════════════════════════════════════════"
  exit 1
fi