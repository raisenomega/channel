#!/usr/bin/env bash
# Bloque F: regla "cada 5 commits se actualiza /docs-hub/current-state.md".
# Cuenta commits desde el último touch al archivo y bloquea si > 5.
set -uo pipefail

TARGET="docs-hub/current-state.md"
MAX_COMMITS=5

# Si el archivo no existe aún (primer commit del slice), permite.
if [ ! -f "$TARGET" ]; then
  echo "  ⚠ ${TARGET} no existe aún — pasa esta vez, créalo pronto"
  exit 0
fi

# Último commit que tocó el archivo (si está gitignored, no estará en git log)
# Como /docs-hub/ está gitignored, usamos mtime del archivo + fecha del commit actual
LAST_SYNC=$(stat -c %Y "$TARGET" 2>/dev/null || stat -f %m "$TARGET" 2>/dev/null || echo 0)
NOW=$(date +%s)
AGE_SECONDS=$((NOW - LAST_SYNC))

# Cuenta commits en las últimas 24h — proxy para "actividad desde último sync"
COMMITS_SINCE=$(git log --since="@$LAST_SYNC" --oneline | wc -l | tr -d ' ')

if [ "$COMMITS_SINCE" -gt "$MAX_COMMITS" ]; then
  echo "  ✗ ${TARGET} desactualizado"
  echo "      commits desde último sync: ${COMMITS_SINCE} (máx ${MAX_COMMITS})"
  echo "      Regla: actualizar cada ${MAX_COMMITS} commits como mínimo."
  echo "      Actualiza el archivo con: estado actual, archivos nuevos,"
  echo "      decisiones tomadas, deuda técnica introducida."
  exit 1
else
  echo "  ✓ ${TARGET} sincronizado (${COMMITS_SINCE}/${MAX_COMMITS} commits)"
fi

exit 0
