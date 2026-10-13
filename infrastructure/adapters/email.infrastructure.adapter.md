# Infraestructura — Adapter `ResendAdapter` (email)

## Proveedor
Resend — email send + receive con inbound webhooks. Activo día 1.
Alterno: Postmark. Fuentes: Gmail / Outlook / IMAP.

## Responsabilidad
Implementar `ChannelAdapter` con `provider = 'resend'`, channel `email`.

## Detalles
- Inbound: webhooks de Resend (o IMAP polling para Gmail/Outlook).
- Outbound: API Resend (HTML rico; composer detecta formato por canal).
- Threading: `Message-ID` / `In-Reply-To` para agrupar hilos.
- Normalización: `from` → `Email` (sanitize), subject → `MessageContent`.

## Nota diferencial
Email es canal v1 (gap de B2Chat) y ciudadano de primera clase junto a WhatsApp.
