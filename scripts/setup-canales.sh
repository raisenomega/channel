#!/usr/bin/env bash
# =============================================================================
# setup-canales.sh — Setup/Configuracion de Canales (desarrollo)
# USO: bash scripts/setup-canales.sh
# -----------------------------------------------------------------------------
# 1) Verifica .env.development.
# 2) Prepara el canal simulado (dev-channel): variables DEV_* para escribir
#    mensajes de prueba en la tabla `messages` via Supabase, sin Zernio/Resend.
# 3) Verifica conectividad a Supabase.
# 4) Documenta el P1 del canal real (Zernio/Resend requieren API keys reales).
# =============================================================================
set -euo pipefail

echo ""
echo "=============================================="
echo "  HUB — Setup de Canales"
echo "=============================================="
echo ""

# 1. Verificar variables de entorno
if [ ! -f .env.development ]; then
  echo "ERROR: .env.development no encontrado."
  echo "  Copiar desde .env.example y completar:"
  echo "  cp .env.example .env.development"
  exit 1
fi

# 2. Preparar canal simulado (dev-channel)
#    Valores se leen de .env.development (no se hardcodean en codigo).
DEV_CONVERSATION_ID="${DEV_CONVERSATION_ID:-}"
DEV_CONTACT_ID="${DEV_CONTACT_ID:-}"
DEV_TENANT_ID="${DEV_TENANT_ID:-}"

echo "[1/4] Canal simulado (dev-channel):"
echo "  DEV_CONVERSATION_ID=${DEV_CONVERSATION_ID:-<pendiente>}"
echo "  DEV_CONTACT_ID=${DEV_CONTACT_ID:-<pendiente>}"
echo "  DEV_TENANT_ID=${DEV_TENANT_ID:-<pendiente>}"

# Escribir variables DEV_* en .env.development si no estan definidas.
append_env() {
  local key="$1" value="$2"
  if ! grep -q "^${key}=" .env.development; then
    echo "${key}=${value}" >> .env.development
    echo "  + ${key} agregado a .env.development"
  fi
}
append_env "DEV_CONVERSATION_ID" "${DEV_CONVERSATION_ID}"
append_env "DEV_CONTACT_ID" "${DEV_CONTACT_ID}"
append_env "DEV_TENANT_ID" "${DEV_TENANT_ID}"

# 3. Verificar conexion a Supabase (servicio de persistencia del canal)
export $(grep -v '^#' .env.development | xargs)
echo "[2/4] Verificando Supabase..."
if [ -n "${SUPABASE_URL:-}" ] && [ -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
  if curl -s -o /dev/null -w "%{http_code}" "$SUPABASE_URL/rest/v1/" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"; then
    echo "  OK: Supabase responde"
  else
    echo "  WARN: No se pudo verificar directamente. Continuando..."
  fi
else
  echo "  WARN: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY vacias. Correr setup-supabase.sh."
fi

echo "[3/4] Recordatorio de canales reales (P1):"
echo "  - ZERNIO / RESEND requieren API keys reales en .env.development para"
echo "    enviar mensajes a WhatsApp/Instagram/Email reales."
echo "  - El canal simulado (dev-channel) evita esa dependencia en desarrollo."

echo "[4/4] Setup de canales completado."
echo "  Siguiente: `bash scripts/setup-supabase.sh` si falta el schema."
echo ""
exit 0