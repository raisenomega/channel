# Infraestructura — Canal Instagram / Messenger

## v1 (activo)
Instagram DM y Facebook Messenger vía **Zernio** (requiere cuenta business / Page).
Ver `zernio.infrastructure.adapter.md`.

## v2 (feature flag)
Meta Graph API directa (`provider = 'meta_direct'`).
Webhook `X-Hub-Signature-256` + challenge; normalización de payload `messaging`.
Rate limits: manejo de códigos 4/613 (throttling) con backoff.
