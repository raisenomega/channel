#!/usr/bin/env bash
# Bloque A: corre los 7 gates oficiales y verifica exit 0 de cada uno.
# Formato de GATES: NAME|COMANDO (pipe como delimitador porque los nombres
# oficiales contienen ":").
set -uo pipefail

GATES=(
  "typecheck|pnpm exec tsc --noEmit --project tsconfig.json"
  "lint|pnpm run lint"
  "check:lines|pnpm run check:lines"
  "check:layers|pnpm run check:layers"
  "check:emojis|pnpm run check:emojis"
  "check:auth|pnpm run check:auth"
  "check:migrations|pnpm run check:migrations"
  "check:eslint-no-raw-login|pnpm run check:eslint-no-raw-login"
  "test:unit|pnpm run test:unit"
  "test:integration|pnpm exec vitest run tests/integration/"
  "adversarial|bash scripts/test-gates.sh"
)

FAIL=0
for g in "${GATES[@]}"; do
  name="${g%%|*}"
  cmd="${g#*|}"
  log=$(mktemp)
  if eval "$cmd" > "$log" 2>&1; then
    echo "  ✓ ${name}"
  else
    code=$?
    echo "  ✗ ${name} (exit ${code})"
    tail -10 "$log" | sed 's/^/      /'
    FAIL=1
  fi
  rm -f "$log"
done

exit $FAIL
