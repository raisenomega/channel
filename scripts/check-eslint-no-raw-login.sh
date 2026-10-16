#!/usr/bin/env bash
# Compuerta #21 — ESLint custom rule: prohibe raw window.location.href = "/login" fuera del helper.
# Skip si: CI sin frontend, o si pnpm/eslint no disponible (WSL sin node).
set -uo pipefail
cd "$(dirname "$0")/.."
if ! command -v pnpm >/dev/null 2>&1; then
  echo "⚠️  pnpm no disponible — skip Compuerta #21"
  exit 0
fi
if [ ! -d apps/tanstack/node_modules/eslint ]; then
  echo "⚠️  sujeto del lint no disponible — skip Compuerta #21"
  exit 0
fi
pnpm exec eslint apps/tanstack/src/ --config eslint.config.js