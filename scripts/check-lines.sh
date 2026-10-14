#!/usr/bin/env bash
# =====================================================================
# Gate DEFINITIVO C4 — Cero Tolerancia (≤75 líneas)
# ---------------------------------------------------------------
# Escanea TODO el código: src/ + apps/tanstack/src + apps/web/src
# Extensiones: .ts .tsx .css .sql
#
# Reglas:
#   1. Un archivo NO listado en allowed que supere 75 líneas → FALLA.
#      (Blanquea cualquier archivo NUEVO que exceda el límite.)
#   2. Un archivo en allowed que CRECE más allá de su conteo registrado
#      → FALLA. (Los legacy no se pueden agrandar; solo reducir.)
#   3. Un archivo en allowed que BAJA a ≤75 → se retira del allowlist
#      (progreso real hacia 0 violaciones).
#
# Uso:
#   ./scripts/check-lines.sh             # modo estándar (usa allowlist)
#   ./scripts/check-lines.sh --strict    # ignora allowlist (todo debe cumplir)
#   ./scripts/check-lines.sh --update-allowlist   # regenera allowlist con conteos actuales
# =====================================================================
set -euo pipefail

readonly MAX=75
readonly DIRS=(src apps/tanstack/src apps/web/src)
readonly EXTS=(ts tsx css sql)
readonly ALLOWLIST="scripts/c4-allowlist.txt"

STRICT=0
UPDATE=0
for a in "$@"; do
  case "$a" in
    --strict) STRICT=1 ;;
    --update-allowlist) UPDATE=1 ;;
    *) echo "❌ argumento desconocido: $a"; exit 2 ;;
  esac
done

# --- Construye la lista de archivos a revisar ----------------------------
find_args=()
for d in "${DIRS[@]}"; do
  for e in "${EXTS[@]}"; do
    find_args+=("$d" -name "*.$e")
  done
done
# find_args termina con un elemento sobrante; lo corregimos
# (construir correctamente con -o)
FILES=""
for d in "${DIRS[@]}"; do
  for e in "${EXTS[@]}"; do
    FILES="$FILES $(find "$d" -type f -name "*.$e" 2>/dev/null)"
  done
done
# quitar duplicados y filtrar node_modules/dist
readarray -t UNIQ < <(printf '%s\n' $FILES | sort -u | grep -v -E 'node_modules|/dist/|\.d\.ts$')

# --- Carga allowlist -------------------------------------------------------
declare -A ALLOWED   # path -> lineas registradas
if [ "$STRICT" -eq 0 ] && [ -f "$ALLOWLIST" ]; then
  while IFS=$'\t' read -r n p; do
    [ -z "$n" ] && continue
    ALLOWED["$p"]=$n
  done < "$ALLOWLIST"
fi

FAIL=0
ALLOWED_ONLY=0
declare -a CLEANUP_PATHS=()

for f in "${UNIQ[@]}"; do
  lines=$(wc -l < "$f")
  if [ "$lines" -le "$MAX" ]; then
    # bajo el limte: si estaba en allowlist, marcar para retirar
    if [ -n "${ALLOWED[$f]:-}" ]; then
      CLEANUP_PATHS+=("$f")
    fi
    continue
  fi

  if [ -n "${ALLOWED[$f]:-}" ]; then
    # archivo legacy permitido
    if [ "$lines" -gt "${ALLOWED[$f]}" ]; then
      echo "🔴 C4 REGRESIÓN: $f creció ($lines > registro ${ALLOWED[$f]})"
      FAIL=1
    else
      ALLOWED_ONLY=$((ALLOWED_ONLY+1))
    fi
    continue
  fi

  # archivo NUEVO que excede 75 → fallo duro
  echo "❌ C4 VIOLATION (nuevo): $f → $lines líneas (máx $MAX)"
  FAIL=1
done

# --- Retirar del allowlist los que ya bajaron -----------------------------
if [ "$UPDATE" -eq 1 ] || [ -f "$ALLOWLIST" ]; then
  if [ "$STRICT" -eq 0 ]; then
    tmp="$ALLOWLIST.tmp"
    : > "$tmp"
    while IFS=$'\t' read -r n p; do
      [ -z "$n" ] && continue
      if [ -f "$p" ]; then
        cur=$(wc -l < "$p")
        if [ "$cur" -le "$MAX" ]; then
          echo "$n	$p (bajó a $cur → retirado)" >&2
          continue
        fi
        echo -e "$cur\t$p"
      else
        echo "⚠ archivo eliminado $p — retirado del allowlist" >&2
      fi
    done < "$ALLOWLIST"
    mv "$tmp" "$ALLOWLIST"
  fi
fi

# --- Resumen ----------------------------------------------------------------
if [ "$FAIL" -eq 0 ]; then
  echo "✅ Gate C4 (≤$MAX líneas): 0 violaciones NUEVAS."
  echo "   Legacy permitidos por allowlist: $ALLOWED_ONLY"
  if [ "${#CLEANUP_PATHS[@]}" -gt 0 ]; then
    echo "   Archivos que bajaron bajo el límite: ${#CLEANUP_PATHS[@]} (retirados del allowlist)"
  fi
  if [ "$STRICT" -eq 1 ]; then
    echo "   (Modo --strict: allowlist ignorado; todo debe cumplir.)"
  fi
  exit 0
else
  echo ""
  echo "❌❌❌ GATE C4 FALLÓ: hay archivos que exceden $MAX líneas sin permiso,"
  echo "   o legacy que crecieron. Corregir antes de commit/merge."
  echo "   Uso: --update-allowlist solo si los NUEVOS ya se refactorizaron."
  exit 1
fi