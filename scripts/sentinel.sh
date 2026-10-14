#!/usr/bin/env bash
# =====================================================================
# HUB by Raisen — SENTINELA Pre-Push
# =====================================================================
# Audita el estado de la rama antes que cualquier commit salga a origin.
# Si cualquier bloque falla → push abortado con mensaje claro.
#
# Diseñado para no ser bypasseable por el agente constructor.
# Único override permitido: $SENTINEL_SKIP=1 solo con firma del auditor
# en commit message [sentinel-override:<razón>].
# =====================================================================
set -uo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

RED=$'\033[0;31m'
GREEN=$'\033[0;32m'
YELLOW=$'\033[1;33m'
NC=$'\033[0m'

FAILED=0
BLOCK_RESULTS=()

run_block() {
  local name="$1"
  local script="$2"
  echo ""
  echo "━━━ Bloque: ${name} ━━━"
  if bash "${script}"; then
    echo "${GREEN}✓ ${name}: OK${NC}"
    BLOCK_RESULTS+=("OK ${name}")
  else
    echo "${RED}✗ ${name}: FALLÓ${NC}"
    BLOCK_RESULTS+=("FAIL ${name}")
    FAILED=1
  fi
}

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  SENTINELA — Verificación pre-push grado bancario            ║"
echo "║  Rama: $(git rev-parse --abbrev-ref HEAD)"
echo "║  Commit: $(git rev-parse --short HEAD)"
echo "╚══════════════════════════════════════════════════════════════╝"

run_block "A — 7 gates oficiales"          "scripts/sentinel/check-gates.sh"
run_block "B — Confidencialidad docs-hub"  "scripts/sentinel/check-confidentiality.sh"
run_block "C — Guards de seguridad"        "scripts/sentinel/check-security-guards.sh"
run_block "D — Referencias a DB"           "scripts/sentinel/check-db-refs.sh"
run_block "E — Dynamic imports cross-layer" "scripts/sentinel/check-dynamic-imports.sh"
run_block "F — Sync de docs ≤5 commits"    "scripts/sentinel/check-docs-sync.sh"
run_block "G — Scan de secretos"           "scripts/sentinel/check-secrets.sh"

bash scripts/sentinel/report-generator.sh "${BLOCK_RESULTS[@]}" || true

echo ""
echo "══════════════════════════════════════════════════════════════"
if [ "$FAILED" -eq 0 ]; then
  echo "${GREEN}✓ SENTINELA: todos los bloques OK — push autorizado${NC}"
  exit 0
else
  echo "${RED}✗ SENTINELA: push BLOQUEADO${NC}"
  echo ""
  echo "Resumen:"
  for r in "${BLOCK_RESULTS[@]}"; do echo "  $r"; done
  echo ""
  echo "Para desbloquear: resolver los hallazgos arriba y reintentar."
  echo "El sentinela NO se puede saltar con --no-verify (hay CI en GitHub"
  echo "Actions que corre lo mismo; la rama no mergea sin que pase)."
  exit 1
fi
