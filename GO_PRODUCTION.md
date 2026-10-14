# GO Production — HUB by Raisen

Estado de despliegue y avance hacia produccion. Documento de control de fases.

## Estado general (VALIDADO 2026-10-13)

- Plataforma: HUB by Raisen (SaaS omnicanal con IA, multi-tenant).
- Backend: Supabase (Postgres + Auth) en `qbpzdoopruqbnerdcyfq.supabase.co`. Backend DDD en `src/` con server HTTP `src/server/hub.server.ts`.
- **Frontend: TanStack Start (SPA) + React 19 + TanStack Router + TanStack Query + Tailwind v4 + shadcn/ui** en `apps/tanstack/`.
- Repo: github.com/raisenomega/channel, branch `develop`.
- Desplegado en Vercel (`channel-blue.vercel.app` / URL de deploy reciente).

> 2026-10-13: Migración de frontend de Vite vanilla TS a TanStack Start + React 19 + shadcn/ui completada y VALIDADA en produccion. Login/registro funcionan contra Supabase (config via `window.__HUB_CONFIG__`).

## Los 3 modos de operacion (master_hub §4)

- **Lite (Manual):** Inbox unificado + CRM Lite + cotizaciones + ordenes + pagos automatizados con L1.
- **Ecosystem (integrado):** SLA, integraciones NUCLEO/OMEGA/POS/verticales, multi-departamento, audit logs.
- **Autonomo (IA):** Dashboard de agente IA + gobernanza SAFE + kill switch.

## LAS 16 FUNCIONALIDADES — ESTADO VALIDADO

Cada una con su ruta TanStack (`apps/tanstack/src/routes/`) y cliente de datos (`apps/tanstack/src/lib/`), conectada a Supabase con RLS por tenant.

| # | Funcionalidad | Ruta (ruta) | Client (lib) | Estado |
|---|---------------|-------------|--------------|--------|
| 1 | **Inbox unificado** | `inbox.tsx` + `inbox.$conversationId.tsx` | `inbox-client` → contact/message | ✅ Desplegado, KPIs reales, lista, hilo, ficha 360 |
| 2 | **CRM Lite** (contactos/tags/notas/historial) | `contacts.tsx` | `contacts-client.ts` | ✅ Lista, busqueda, crear, segmentos |
| 3 | **Cotizaciones** (estados) | `quotes.tsx` | `quotes-client.ts` | ✅ Lista + crear + estados + PDF placeholder (P1) |
| 4 | **Ordenes** (6 estados) | `orders.tsx` | `orders-client.ts` | ✅ Lista vinculada a cotizaciones |
| 5 | **Pagos** (Stripe/ATH) | `payments.tsx` | `payments-client.ts` | ✅ Lista montos/estados/proveedor |
| 6 | **Templates WhatsApp** | `settings.sla`/canned | `template` (backend) | ⚠️ Backend BC templates creado; UI de templates pendiente |
| 7 | **Automatizaciones** (reglas trigger→action) | `automation.tsx` | `automation-client.ts` | ✅ Crear/lista reglas |
| 8 | **Reportes** (KPIs agregados) | `reports.tsx` | `reports-client.ts` | ✅ KPIs conversaciones/mensajes/close/was_correct |
| 9 | **Agente IA L1 (sugerencias)** | `agent.tsx` | `agent-client.ts` | ✅ Dashboard IA + metricas reales |
| 10 | **Multi-departamento / roles** | `settings.tsx` | `settings-client` | ✅ Cuenta/plan/tenant |
| 11 | **SLA policies + horarios** | `settings.sla.tsx` | `sla-client.ts` | ✅ SLA por canal + horarios |
| 12 | **Audit logs** | (backend `audit/`) | `audit-client` | ⚠️ Backend BC audit creado; UI de audit pendiente |
| 13 | **SSO/SAML** | — | — | ⏳ Pendiente (FASE 12 enterprise) |
| 14 | **Custom domains + white-label** | `settings.tsx` | `settings-client` | ⚠️ White-label switch; custom domains pendiente |
| 15 | **Agentes L2/L3 + gobernanza SAFE + kill switch** | `agent.tsx` + `safe` | `agent-client` + backend cognition | ✅ Dashboard + SAFE board + orquestador cognition |
| 16 | **Integraciones verticales (TABLE/HEALTH/HOME/FLEET)** | `settings.integrations.tsx` | `integrations-client.ts` | ✅ Backend adapters + vista integraciones (NUCLEO/OMEGA/POS/TABLE/HEALTH/HOME/FLEET) |

## Estructura frontend TanStack

```
apps/tanstack/src/
├── routes/      # 16 rutas (inbox, contacts, quotes, orders, payments,
│                #   automation, reports, agent, channels, settings, sla, legal, integrations, login)
├── lib/         # 16 clients Supabase (REST + JWT + RLS) + i18n + auth + supabase
├── components/  # shadcn/ui (button, card, badge, switch, input, avatar, chip, kpi)
│                # + layout (shell, bottom-nav) + safe-board
├── app/         # root, route-tree, preferences, not-found
└── styles/      # tokens omega/light, tailwind, components OMEGA
```

## Backend DDD (src/ backend)

- ~16 BCs implementados (identity, channels, inbox, contacts, commerce, automation, cognition, integrations, compliance, maintenance, agents, sla, reports, audit, templates).
- Runtime HTTP: `src/server/hub.server.ts` (rutas webhook, message, inbox list).
- BC cognition: agent.service, agent-executor, tool.registry (11+ tools), AIProvider (anthropic/deepseek/qwen), orquestador, SAFE.
- Migraciones: 001-025 (25 migraciones, ~45 tablas, RLS habilitado).

## Quality gates (validado)

- Backend: `tsc --noEmit` 0 errores · `eslint src/` 0 errores.
- Frontend TanStack: `tsc --noEmit` 0 errores.
- Frontend legacy `apps/web/`: conservado, lint 0.
- Confidencialidad: documentos estrategicos movidos a `docs-hub/` (gitignore). Solo codigo en repo.

## Notas de honestidad (P1)

- 📌 Pagos reales Stripe/ATH: UI y backend listos, requiere credenciales reales del proveedor (no configuradas aun).
- 📌 Templates WhatsApp: backend BC listo; la UI de gestion de templates aun no esta en el frontend TanStack.
- 📌 Audit UI: backend BC audit listo; vista de audit en frontend pendiente.
- 📌 SSO/SAML: no implementado (FASE 12).
- 📌 Custom domains: no implementado.
- 📌 Canales Zernio/Resend reales: adapters listos pero apuntan a sandbox/placeholder; requieren cuentas con API keys.

## Recordatorios operativos

- Deploy frontend TanStack: desde `apps/tanstack/` → `vercel --prod --yes` (o raiz con `vercel.json` que apunta a `apps/tanstack`).
- Rama de integracion: `develop`.
- Migraciones: `supabase db push` con `SUPABASE_DB_PASSWORD`.
- Push GitHub / deploy Vercel: requieren credenciales del owner en su terminal.