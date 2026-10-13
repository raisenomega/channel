# Infraestructura — Canal Telegram

## v1 (activo)
Telegram vía **Zernio** (Bot API gratuita). Ver `zernio.infrastructure.adapter.md`.

## v2 (alterno directo)
Telegram Bot API oficial: `setWebhook` con secret token, normalización de
payload `update`, `sendMessage` sin restricción de ventana de 24h.
