# Infraestructura — Adapter `ZernioAdapter`

## Proveedor
Zernio — capa unificada de canales (BSP verificado Meta). Activo día 1.

## Canales cubiertos (7)
WhatsApp, Instagram DM, Facebook Messenger, Telegram, SMS, X/Twitter DM, LinkedIn (parcial).

## Responsabilidad
Implementar `ChannelAdapter` con `provider = 'zernio'`.

## Detalles
- WhatsApp vía **Embedded Signup de Meta** (sin App Review de Raisen).
- SMS backed por Twilio (soporte 10DLC US).
- Webhook: verificación de firma del proveedor.
- Reintentos con backoff; dead-letter a `webhook_failures`.

## Nota estratégica
Zernio permite migrar a Meta Cloud API directo (v2) sin refactor gracias al
adapter pattern (HP3). Los archivos `whatsapp/instagram/telegram` describen la
ruta v2 directa; en v1 todo pasa por Zernio.
