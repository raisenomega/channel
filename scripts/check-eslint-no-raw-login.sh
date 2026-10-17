#!/usr/bin/env bash
# Compuerta #21 — ESLint custom rule: prohibe raw window.location.href = "/login" fuera del helper.
# Ejecuta eslint contra apps/tanstack/src. Si la toolchain no esta disponible en CI, skip.
set -uo pipefail
cd "$(dirname "$0")/.."
if [ "${CI:-false}" = "true" ]; then
  echo "⚠️  CI — saltando Compuerta #21 (frontend toolchain no disponible)"
  exit 0
fi
pnpm exec eslint apps/tanstack/src/ --config eslint.config.js