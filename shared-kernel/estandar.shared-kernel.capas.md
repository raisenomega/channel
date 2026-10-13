# Estándar Cero Tolerancia — 4 Capas DDD

## Las 4 capas obligatorias por Bounded Context
```
presentation → application → domain ← infrastructure
```

| Capa | Contiene | Prohibido |
|---|---|---|
| `domain` | Entidades, Value Objects, Aggregates, contratos de repositorio, `Result<T,E>` | Dependencias externas, efectos secundarios |
| `application` | Casos de uso CQRS, orquestación, DTOs | Lógica de dominio, acceso directo a infra |
| `infrastructure` | Adapters, persistencia, proveedores (Zernio, Resend, Supabase, Claude) | Reglas de negocio |
| `presentation` | UI (React), componentes, hooks | Lógica de negocio |

## Reglas críticas (subset — ver `DDD-CERO-TOLERANCIA-HUB.md`)
- **A1** — las 4 capas son obligatorias por Bounded Context.
- **A2** — cero imports externos en `domain/` (nada de `@supabase`, `react`, `@anthropic-ai/sdk`, `stripe`).
- **A4** — `cognition/` es un BC de primera clase (adapter de IA).
- **A5** — `Result<T, Error>` en lugar de excepciones en domain.
- **A6** — `readonly<>` en todas las interfaces de dominio.
- **A7** — Value Objects para invariantes (Money, Percentage, Email, Phone, TenantId, ConversationId, MessageId).
- **A8** — mappers solo en infrastructure (snake_case ↔ camelCase).
- **N1** — aislamiento estricto de tenant vía RLS.

## Cero filtración
`domain` no importa `application`/`infrastructure`/`presentation`.
`application` depende de contratos (interfaces), no de implementaciones.
