#!/usr/bin/env bash
# Bloque B: protege /docs-hub/ y archivos sensibles.
set -uo pipefail

FAIL=0

# 1) /docs-hub/ debe estar en .gitignore
if ! git check-ignore -q docs-hub/dummy 2>/dev/null && ! grep -qE '^/?docs-hub/?' .gitignore 2>/dev/null; then
  echo "  ✗ /docs-hub/ no está en .gitignore"
  FAIL=1
else
  echo "  ✓ /docs-hub/ está gitignored"
fi

# 2) Ningún archivo bajo docs-hub/ puede estar staged en el commit a pushear
STAGED_DOCS=$(git diff --name-only HEAD~1..HEAD 2>/dev/null | grep -E '^docs-hub/' || true)
if [ -n "$STAGED_DOCS" ]; then
  echo "  ✗ archivos bajo docs-hub/ en el commit — NO deben pushearse:"
  echo "$STAGED_DOCS" | sed 's/^/      /'
  FAIL=1
else
  echo "  ✓ ningún archivo docs-hub/ en commits a pushear"
fi

# 3) Ningún .md documental fuera de los permitidos
ALLOWED_MDS="^(README|SETUP|GO_PRODUCTION|AUDITORIA_S1_S5)\.md$"
NEW_MDS=$(git diff --name-only HEAD~1..HEAD 2>/dev/null | grep -E '^[^/]+\.md$' | grep -vE "$ALLOWED_MDS" || true)
if [ -n "$NEW_MDS" ]; then
  echo "  ✗ .md documental no autorizado a nivel raíz:"
  echo "$NEW_MDS" | sed 's/^/      /'
  echo "      (todo documento interno va a /docs-hub/)"
  FAIL=1
else
  echo "  ✓ ningún .md no autorizado en raíz"
fi

exit $FAIL
