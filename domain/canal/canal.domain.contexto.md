# Dominio — Canal: Contexto

## Propósito
Abstrae los proveedores de canal (WhatsApp, email, redes) detrás de un contrato común.

## Lenguaje ubicuo
- **Inbox**: instancia de un canal conectado para un tenant.
- **Proveedor v1**: Zernio (WhatsApp/IG/FB/TG/SMS/X/LinkedIn), Resend (email), HUB (webchat).

## Invariantes
1. Un inbox pertenece a un tenant y tiene un único `channel_type`.
2. Los secretos del proveedor nunca viven en el dominio (solo referencia).
3. El dominio de canal no conoce el formato de payload de ningún proveedor.

## Dependencias
Solo `shared-kernel`. La conexión real vive en `infrastructure/adapters`.
