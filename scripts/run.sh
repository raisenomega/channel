#!/usr/bin/env bash
# ====================================================================
# HUB by Raisen — run.sh
# Atajo para arrancar el server desde la raiz del proyecto.
# ====================================================================
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$DIR/start-server.sh" "$@"