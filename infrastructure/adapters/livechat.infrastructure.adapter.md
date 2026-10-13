# Infraestructura — Adapter `NativeWebchatAdapter`

## Proveedor
Widget web nativo (embed en el sitio del cliente). Activo día 1.

## Responsabilidad
Implementar `ChannelAdapter` para `channel_type = 'webchat'`.

## Detalles
- Transporte: Supabase Realtime (tiempo real).
- Pre-chat form, file uploads, handoff automático a humano si la IA no puede.
- Multi-idioma. White-label opcional en Enterprise.
