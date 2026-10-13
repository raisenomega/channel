# Infraestructura — Adapter `NucleoAdapter`

## Propósito
Sincronizar CRM (contactos, cotizaciones, órdenes) con NÚCLEO.

## Responsabilidad
Implementar el gateway de integración `nucleo` (tipo en `integration_configs`).

## Detalles
- Inbound/outbound: sync bidireccional de `contacts`, `quotes`, `orders`.
- Cada sync registra `integration_sync_logs` (success/failed/partial).
- IDs externos: `nucleo_customer_id`, `nucleo_quote_id`, `nucleo_order_id`.

## Reglas
- Si NÚCLEO no está disponible, HUB opera en modo `lite` sin bloquear.
