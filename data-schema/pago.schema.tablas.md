# Data Schema — Pagos

## Tabla `payments`
| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid PK | Identificador |
| tenant_id | uuid FK → tenants | Tenant |
| order_id | uuid FK → orders | Orden |
| amount | decimal(12,2) NOT NULL | Monto |
| currency | varchar(3) DEFAULT 'USD' | Moneda |
| status | enum | pending / completed / failed / refunded |
| provider | text | stripe / mercadopago / ... |
| provider_payment_id | text | ID de transacción |
| initiated_by_type | enum | human / ai_agent / automation |
| created_at | timestamptz | DEFAULT NOW() |

## Tabla `payment_methods_config`
| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid PK | Identificador |
| tenant_id | uuid FK → tenants | Tenant |
| provider | text NOT NULL | Proveedor |
| config | jsonb | Config |
| secrets_encrypted | jsonb | Secretos cifrados |
| is_active | boolean DEFAULT true | Habilitado |

## RLS
Ambas con `tenant_isolation_*`.
