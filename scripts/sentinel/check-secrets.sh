#!/usr/bin/env bash
# Bloque G: scan de secretos reales en archivos del commit a pushear.
# Patrones específicos (no falsos positivos genéricos como "password=").
set -uo pipefail

FAIL=0

# Lista de archivos modificados en los commits a pushear
# (los que están entre upstream y HEAD)
FILES=$(git diff --name-only "$(git merge-base HEAD origin/develop 2>/dev/null || echo HEAD~5)"..HEAD 2>/dev/null | grep -vE '\.(lock|png|jpg|svg|pdf)$' || true)

if [ -z "$FILES" ]; then
  echo "  ✓ sin archivos nuevos para escanear"
  exit 0
fi

# Patrones de secretos reales (específicos, no genéricos)
PATTERNS=(
  'BEGIN (RSA |EC |DSA |)PRIVATE KEY'
  'EAAG[A-Za-z0-9]{20,}'                 # Meta long-lived token
  'xoxb-[A-Za-z0-9-]{10,}'               # Slack bot token
  'ghp_[A-Za-z0-9]{30,}'                 # GitHub personal token
  'sk_live_[A-Za-z0-9]{20,}'             # Stripe live
  'rk_live_[A-Za-z0-9]{20,}'             # Stripe restricted
  'AIza[A-Za-z0-9_-]{30,}'               # Google API
  'aws_secret_access_key\s*=\s*[A-Za-z0-9/+]{40}'
  'META_APP_SECRET\s*=\s*["\x27]?[a-f0-9]{30,}'  # Meta app secret inline
)

for f in $FILES; do
  [ ! -f "$f" ] && continue
  for p in "${PATTERNS[@]}"; do
    if grep -qE "$p" "$f" 2>/dev/null; then
      echo "  ✗ posible secreto en: $f"
      echo "      patrón: $p"
      FAIL=1
    fi
  done
done

if [ $FAIL -eq 0 ]; then
  echo "  ✓ ningún secreto conocido detectado"
fi

exit $FAIL
