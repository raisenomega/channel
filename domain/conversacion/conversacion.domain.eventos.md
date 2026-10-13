# Dominio — Eventos de Conversación (Supabase Realtime)

## Eventos que HUB emite (snake_case)
```ts
type HubEvent =
  | 'conversation.created' | 'conversation.status_changed'
  | 'message.received' | 'message.sent'
  | 'quote.created' | 'quote.accepted' | 'quote.rejected'
  | 'order.confirmed' | 'order.cancelled'
  | 'payment.received' | 'sla.violated'
  | 'agent_ai.action_taken' | 'agent_ai.escalated_to_human'
  | 'agent_ai.correction_received';
```

## Eventos que HUB consume (ecosistema)
`nucleo.contact.updated`, `nucleo.invoice.created`, `pos.sale.completed`,
`omega.campaign.sent`, `omega.brand_voice.updated`, `table.reservation.updated`,
`home.maintenance.created`, `fleet.delivery.status_changed`.

## Reglas
- Transporte: Supabase Realtime (no REST punto a punto).
- Un evento es un hecho pasado, inmutable (`Object.freeze`).
- Los handlers viven en `application`; la entrega física en `infrastructure`.
