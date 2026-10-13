# Infraestructura — Adapter `MetaDirectAdapter` (WhatsApp v2)

## Proveedor
Meta Cloud API directa. Se activa cuando Raisen pase App Review de Meta.

## Responsabilidad
Implementar `ChannelAdapter` con `provider = 'meta_direct'`.

## Detalles
- WhatsApp + Instagram + Messenger vía Graph API.
- Webhook `X-Hub-Signature-256` (HMAC-SHA256) + challenge de verificación.

## Estado
v2 — feature flag. No bloquea el lanzamiento: **Zernio cubre WhatsApp en v1**
(ver `zernio.infrastructure.adapter.md`).
