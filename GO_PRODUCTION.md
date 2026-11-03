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
| 3 | **Cotizaciones** | `quotes.tsx` | `quotes-client.ts` | ✅ Lista + crear/editar (cliente+SKU precargados) + estados + PDF real + "Convertir a factura" + numero ZR |
| 4 | **Ordenes** (6 estados) | `orders.tsx` | `orders-client.ts` | ✅ Lista vinculada a cotizaciones |
| 5 | **Pagos** (Stripe/ATH) | `payments.tsx` | `payments-client.ts` | ✅ Lista montos/estados/proveedor |
| 6 | **Templates WhatsApp** | `templates.tsx` + `templates-ui/` | `templates-client` | ✅ UI completa (catalogo/tabs) + 25/25 plantillas APROBADAS en Meta |
| 6b | **Facturas** (global) | `invoices.tsx` + `invoices/` | `invoices-client.ts` | ✅ Vista global `/invoices` + editor/PDF + pestana Factura por contacto + numero ZR heredado |
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

- ~20 BCs implementados (identity, channels, inbox, contacts, commerce, automation, cognition, integrations, compliance, maintenance, agents, sla, reports, audit, templates, notifications, oauth, pay, tenants + shared/server).
- Runtime HTTP: `src/server/hub.server.ts` — ahora con readBody acotado (1MB+timeout), timeouts de conexion y graceful shutdown (SIGTERM); media-proxy; webhooks.
- BC cognition: agent.service, agent-executor, tool.registry, AIProvider (anthropic/deepseek/qwen) con timeouts + degradacion, orquestador, SAFE, vision (fotos), STT (audio), presupuesto LLM/dia por tenant, consulta/escalada con anti-rafaga + lazo cerrado.
- Migraciones: 001-106 (RLS habilitado; messages/audit_logs/consent_log/integration_sync_logs/automation_rule_executions PARTICIONADAS y escribiendo; indice conv+created; secuencia ZR compartida cotizacion->factura->orden).

## Quality gates (validado)

- Backend: `tsc --noEmit` 0 errores · `eslint src/` 0 errores.
- Frontend TanStack: `tsc --noEmit` 0 errores.
- Frontend legacy `apps/web/`: conservado, lint 0.
- Confidencialidad: documentos estrategicos movidos a `docs-hub/` (gitignore). Solo codigo en repo.

## Notas de honestidad (P1)

- 📌 Pagos reales Stripe/ATH: UI y backend listos, requiere credenciales reales del proveedor (no configuradas aun).
- ✅ Templates WhatsApp: UI completa + 25/25 plantillas APROBADAS en Meta (ya NO es pendiente).
- 📌 Audit UI: backend + tabla particionada REPARADA (audit_logs/consent_log ya escriben, migr 105); la vista de audit en frontend sigue pendiente.
- 📌 SSO/SAML: no implementado (FASE 12).
- 📌 Custom domains: no implementado.
- 📌 Canales Zernio/Resend reales: adapters listos pero apuntan a sandbox/placeholder; requieren cuentas con API keys.

## Recordatorios operativos

- Deploy frontend TanStack: desde `apps/tanstack/` → `vercel --prod --yes` (o raiz con `vercel.json` que apunta a `apps/tanstack`).
- Rama de integracion: `develop`.
- Migraciones: `supabase db push` con `SUPABASE_DB_PASSWORD`.
- Push GitHub / deploy Vercel: requieren credenciales del owner en su terminal.
- Migraciones a prod: por el naming (035-bis) `supabase db push` del CLI falla; se aplican via SQL Editor + se registran en `supabase_migrations.schema_migrations` (asi pasa la Compuerta #20 de drift).

## Avances 2026-10-13 -> 2026-11-03 (reconciliado contra codigo/repo)

Resumen honesto de "como vamos" tras auditoria multi-agente + ~13 PRs desplegados a prod.

### Entregado y en prod
- **Visión + voz del agente:** lee/entiende FOTOS entrantes (WhatsApp/IG/FB via Zernio -> LLM) y transcribe AUDIO (STT whisper). VIDEO aun no (lo ignora).
- **CEREBRO (RAG+grafo):** cableado; memoria del cliente fluye al razonador (degrada a vacio sin CEREBRO_URL).
- **Coherencia consulta/escalada:** anti-rafaga (dedup por conversacion+tema), lazo cerrado (el agente confirma/pregunta y marca "listo para cerrar"), aprende de verdad (agent_knowledge + cerebro) y consulta antes de repreguntar. Flujo CONGELADO, tocado solo con firma del dueno.
- **Números honestos (sin tope):** COUNT real (no `.length` topado a 1000) en reportes y tarjetas KPI; ALERTA honesta; rendimiento de agentes = barra por agente.
- **Robustez a escala (audit 50k):** timeouts en llamadas LLM (anti-OOM) · readBody acotado + graceful shutdown · presupuesto LLM/dia por tenant · particiones de audit_logs/consent_log/etc. (estaban ROTAS, ahora escriben) + indice de messages.
- **Comercio — ciclo completo:** `/invoices` global (clon de /quotes) · Facturas por contacto · secuencia ZR compartida cotizacion->factura->orden->pago · editor/PDF cargan cliente+SKU reales (fix de lectura RLS).
- **Inbox/chat:** nombre REAL del contacto en el dashboard (antes "Contacto") · se ven TODAS las fotos del chat (render por mime aunque content_type sea "text") · barra de redes: icono abre su red, barra vacia abre WhatsApp (celular shell).
- **Plantillas:** 25/25 APROBADAS en Meta + UI completa.

### Pendiente (ordenado)
- **Avatares de contacto:** probe desplegado para confirmar si Zernio envia foto de perfil (IG/FB); WhatsApp no la da (privacidad). Build B tras confirmar.
- **Robustez Tanda C/D:** cola durable + workers, scheduler con lock, rate-limit distribuido, observabilidad (Sentry/OTEL), frontend polling->Realtime. (Permite autoescalar a 50k.)
- **Deuda media:** service-role -> RLS por tenant (audit #9), video del agente, aislamiento por canal+cuenta (DEBT-CAPA-1A), UI de audit logs, SSO/SAML + custom domains (Fase 12).
- **Comercial:** facturacion/suscripciones SaaS + gating por plan (no existe).

### Techo de escala honesto hoy
~1-2k usuarios ACTIVOS concurrentes (1 proceso Node + 1 Postgres); 50k REGISTRADOS se almacenan sin problema. Ver `Auditoria_50k.md`.