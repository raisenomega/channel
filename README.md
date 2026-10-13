# HUB by Raisen — Plataforma 12 del ecosistema RAISEN.dev

> Comunicación omnicanal con opción de autonomía IA. Inbox unificado + CRM +
> ventas + cobros, operado por agentes IA indistinguibles del humano.

## ⛔ Confidencialidad (leer primero)
Toda la documentación fundamental vive **solo en local** y está en `.gitignore`.
**Nunca se commitea, nunca se hace push.** Propiedad de raisen.agency.
El repo remoto (`github.com/raisenomega/hub`) contiene solo código.

## Estándar de gobierno
- **Cero Tolerancia**: DDD 4 capas, archivos ≤75 líneas, responsabilidad única.
- Reglas: `shared-kernel/estandar.shared-kernel.reglas.md`
- Capas: `shared-kernel/estandar.shared-kernel.capas.md`
- Nombres: `shared-kernel/estandar.shared-kernel.nombres.md`

## Bounded Contexts (22)
`inbox` · `channels` · `contacts` · `conversations` · `messages` · `quotes` ·
`orders` · `payments` · `automation` · `cognition` · `agents` · `teams` · `sla` ·
`business-hours` · `templates` · `webchat` · `reports` · `integrations` ·
`notifications` · `audit` · `identity` · `tenant`

## Estructura (capas DDD)
| Carpeta | Responsabilidad |
|---|---|
| `shared-kernel/` | Estándar Cero-Tolerancia |
| `product/` | PRD: visión, canales, modos, precios |
| `architecture/` | Stack, diagrama, gobernanza, design system |
| `data-schema/` | Tablas por BC (RLS, índices) |
| `domain/` · `application/` · `infrastructure/` | Capas DDD por contexto |

## Índice maestro
→ `meta/indice.maestro.meta.md` · Estado real → `meta/source-of-truth.meta.md`
