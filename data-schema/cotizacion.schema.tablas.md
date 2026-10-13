# Data Schema — Cotizaciones

## Tabla `quotes`
| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid PK | Identificador |
| tenant_id | uuid FK → tenants | Tenant |
| contact_id | uuid FK → contacts | Contacto |
| mode | enum | lite / nucleo_synced |
| nucleo_quote_id | uuid | Sync NÚCLEO |
| status | enum | draft / sent / accepted / rejected / expired |
| total_amount | decimal(12,2) | Monto total |
| currency | varchar(3) DEFAULT 'USD' | Moneda |
| created_by_type | enum | human / ai_agent |
| ai_interaction_id | uuid | Trazabilidad IA |
| created_at | timestamptz | DEFAULT NOW() |

## Tabla `quote_line_items`
| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid PK | Identificador |
| quote_id | uuid FK → quotes | Cotización |
| description | text NOT NULL | Concepto |
| quantity | int NOT NULL | Cantidad |
| unit_price | decimal(12,2) NOT NULL | Precio unitario |
| total | decimal(12,2) | quantity × unit_price |

## RLS
Ambas con `tenant_isolation_*`; `quote_line_items` por join a `quotes.tenant_id`.
