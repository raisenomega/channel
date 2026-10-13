# Data Schema — Órdenes

## Tabla `orders`
| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid PK | Identificador |
| tenant_id | uuid FK → tenants | Tenant |
| contact_id | uuid FK → contacts | Contacto |
| quote_id | uuid FK → quotes | Cotización origen |
| nucleo_order_id | uuid | Sync NÚCLEO |
| nucleo_invoice_id | uuid | Factura NÚCLEO |
| status | enum | pending / paid / shipped / delivered / cancelled |
| total_amount | decimal(12,2) | Monto total |
| ai_interaction_id | uuid | Trazabilidad IA |
| ai_confidence | real | Confianza de la IA |
| created_at | timestamptz | DEFAULT NOW() |

## Tabla `order_line_items`
| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid PK | Identificador |
| order_id | uuid FK → orders | Orden |
| description | text NOT NULL | Concepto |
| quantity | int NOT NULL | Cantidad |
| unit_price | decimal(12,2) NOT NULL | Precio unitario |

## RLS
Ambas con `tenant_isolation_*`.
