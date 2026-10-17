#!/usr/bin/env bash
# Compuerta #21 — ESLint custom rule: prohibe raw window.location.href = "/login" fuera del helper.
# Ejecuta eslint contra apps/tanstack/src. Corre REAL tambien en CI (D-32 cerrado
# en Hotfix L): el workflow instala las deps del root, que traen eslint +
# typescript-eslint, suficiente para esta regla (no es type-aware).
# Zero skip condicional: si la toolchain falta, el gate FALLA.
set -uo pipefail
cd "$(dirname "$0")/.."

if ! pnpm exec eslint --version >/dev/null 2>&1; then
  echo "ERROR Compuerta #21 — eslint no disponible (correr pnpm install). Gate NO se salta."
  exit 1
fi

pnpm exec eslint apps/tanstack/src/ --config eslint.config.js
STATUS=$?
if [ "$STATUS" -ne 0 ]; then
  echo "ERROR Compuerta #21 FAIL — redirect crudo a /login fuera de redirect-on-error.ts"
  exit "$STATUS"
fi
echo "OK Compuerta #21: 0 redirects crudos a /login en apps/tanstack/src."
