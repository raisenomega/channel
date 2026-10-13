# Agente IA — Catálogo de Tools

> Heredado de `master_hub.md §7.8`. Cada tool con precondiciones y escalation triggers.

## Conversación (siempre disponibles)
- `send_message(channel, contact_id, text, attachments?)` — enviar respuesta.
- `send_template(channel, contact_id, template_name, params)` — template WhatsApp.
- `mark_conversation_status(conv_id, status)` — cambiar estado.
- `add_note(conv_id, note_private)` — nota interna.
- `add_tag(contact_id, tag)` — etiquetar.
- `escalate_to_human(conv_id, reason, assign_to?)` — escalar con contexto.

## Ventas — Modo Lite (CRM propio)
- `create_quote(contact_id, items, total, notes?)`
- `send_quote_pdf(quote_id, channel)`
- `convert_quote_to_order(quote_id)`
- `send_payment_link(order_id, channel)`
- `mark_order_status(order_id, status)`

## Ventas — Modo Ecosystem (vía NÚCLEO)
- `create_nucleo_quote(contact_id, line_items)` → cotización fiscal.
- `convert_to_nucleo_invoice(quote_id)` → factura fiscal.
- `apply_nucleo_customer_pricing(contact_id, item_id)`