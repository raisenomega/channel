# Agente IA — Tools de Verticales

> Integración con TABLE, HEALTH, HOME, FLEET, POS.

## TABLE (restaurantes)
- `check_table_availability(datetime, party_size)`
- `book_table_reservation(datetime, party_size, contact_id)`

## HEALTH (bienestar/salud)
- `check_health_appointments(professional_id, date_range)`
- `book_health_session(professional_id, datetime, contact_id)`

## HOME (bienes raíces)
- `get_home_property_info(property_id)`
- `create_home_maintenance_ticket(property_id, description, photos?)`

## FLEET (logística)
- `get_fleet_delivery_status(order_id)`
- `notify_fleet_delivery_delay(order_id, new_eta)`

## POS (punto de venta)
- `get_pos_customer_history(contact_id)`
- `send_pos_receipt(sale_id, channel)`

## CRM (cross-modo)
- `update_contact(contact_id, fields)`
- `add_contact_note(contact_id, note)`
- `add_contact_to_segment(contact_id, segment)`
- `sync_to_nucleo_crm(contact_id)` (Ecosystem)