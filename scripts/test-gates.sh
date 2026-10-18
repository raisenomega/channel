#!/usr/bin/env bash
# =====================================================================
# Prueba adversarial de los gates (test-gates.sh)
# Inyecta temporalmente 'any' en un archivo y confirma que lint falla.
# Si el gate pasa cuando deberia fallar, el gate esta roto.
# =====================================================================
set -euo pipefail

TARGET="src/cognition/domain/tool.types.ts"

# Buscar el primer archivo .ts que no este en domain/ para la prueba
if [ ! -f "$TARGET" ]; then
  echo "⚠ No se encontro $TARGET. Buscando archivo alternativo..."
  TARGET=$(find src -name '*.ts' -not -path '*/domain/*' | head -1)
  if [ -z "$TARGET" ]; then
    echo "❌ No hay archivo .ts para la prueba adversarial."
    exit 2
  fi
  echo "Usando $TARGET"
fi

echo "=== Prueba adversarial: inyectar 'any' en $TARGET ==="

# Backup + trap: restaura SIEMPRE el TARGET, incluso si el script se interrumpe (Ctrl+C / kill /
# fallo) entre la inyeccion y la restauracion. Sin esto, una corrida interrumpida dejaba el `any`
# inyectado en un archivo real (tool.types.ts) -> lint rojo en el proximo push (Compuerta #148).
cp "$TARGET" "$TARGET.bak"
trap 'cp "$TARGET.bak" "$TARGET" 2>/dev/null || true; rm -f "$TARGET.bak"' EXIT INT TERM

# Inyectar 'any' en el codigo (no en comentario)
echo "" >> "$TARGET"
echo "// Inyeccion adversarial: siguiente linea debe fallar en lint" >> "$TARGET"
echo "const __test_any__: any = 42;" >> "$TARGET"

# Verificar que lint SI falla (el trap restaura el TARGET en cualquier salida)
echo "--- Corriendo pnpm lint ---"
if pnpm lint 2>&1; then
  echo "❌ FALLO ADVERSARIAL: lint NO detecto el any inyectado. Gate esta roto."
  exit 1
fi
echo "✅ lint detecto el any correctamente — gate funcional."
echo "=== Prueba adversarial: OK ==="
exit 0