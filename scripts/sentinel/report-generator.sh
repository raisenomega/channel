#!/usr/bin/env bash
# Genera reporte markdown del sentinela para que el auditor lo lea.
# Reporte → .sentinel-reports/<branch>-<timestamp>.md (gitignored)
set -uo pipefail

BRANCH=$(git rev-parse --abbrev-ref HEAD)
COMMIT=$(git rev-parse --short HEAD)
STAMP=$(date +%Y%m%d-%H%M%S)
OUT_DIR=".sentinel-reports"
mkdir -p "$OUT_DIR"
OUT="${OUT_DIR}/${BRANCH//\//_}-${STAMP}-${COMMIT}.md"

{
  echo "# Sentinel Report — ${BRANCH}"
  echo ""
  echo "- **Commit**: ${COMMIT}"
  echo "- **Timestamp**: $(date -Iseconds)"
  echo "- **Autor commit**: $(git log -1 --format=%an)"
  echo ""
  echo "## Resumen bloques"
  echo ""
  for r in "$@"; do echo "- $r"; done
  echo ""
  echo "## Archivos cambiados"
  echo ""
  echo '```'
  git diff --stat "$(git merge-base HEAD origin/develop 2>/dev/null || echo HEAD~5)"..HEAD 2>/dev/null | head -50
  echo '```'
  echo ""
  echo "## Líneas por archivo nuevo"
  echo ""
  echo '```'
  git diff --name-only "$(git merge-base HEAD origin/develop 2>/dev/null || echo HEAD~5)"..HEAD 2>/dev/null \
    | grep -E '\.(ts|sql|sh)$' \
    | while read -r f; do [ -f "$f" ] && printf '%4d  %s\n' "$(wc -l < "$f")" "$f"; done \
    | sort -rn | head -20
  echo '```'
  echo ""
  echo "---"
  echo "_Reporte generado por scripts/sentinel.sh — para el auditor._"
} > "$OUT"

echo ""
echo "📄 Reporte: ${OUT}"
