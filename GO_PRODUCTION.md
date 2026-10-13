# GO Production — HUB by Raisen

Estado de despliegue y avance hacia produccion. Documento de control de fases.

## Estado general

- Plataforma: HUB by Raisen (SaaS omnicanal con IA, multi-tenant).
- Backend: Supabase (Postgres + Auth) en `qbpzdoopruqbnerdcyfq.supabase.co`.
- Frontend: Vite (vanilla TS) desplegado en Vercel (`channel-blue.vercel.app`).
- Repo: github.com/raisenomega/channel, branches `develop`, `staging`, `main`.

> 2026-10-13: Despliegue en Vercel fijo (se quito bins nativos Windows del package.json y se fijo pnpm en lockfile 9.0). Build en Linux OK. El sitio sirve `channel-blue.vercel.app` con proteccion de Vercel Auth (el owner logueado ve la app).

## Fases del roadmap

| Fase | Descripcion | Estado | Notas |
|------|-------------|--------|-------|
| FASE 0-11 | Dominio, BC, migraciones, UI | COMPLETO | schema 001-023 aplicado |
| FASE A | Governance de ramas | COMPLETO | main/develop/staging |
| FASE B | Migraciones y rollback | COMPLETO | 23 migraciones + down |
| FASE C | Variables de entorno y scripts | COMPLETO | .env + scripts |
| FASE D | Login y autenticacion (Supabase Auth) | COMPLETO | registro + onboarding + shell funcionales |
| FASE E | Tenant onboarding (RPC crear_tenant) | COMPLETO | crea tenant + `mi_tenant` resuelve post-login |
| FASE F | Monitoring + logging estructurado | COMPLETO | logger + Vigia + app_events |
| FASE G | Integration tests (identity) | PARCIAL | stores en memoria + flujos multi-tenant |
| FASE H | Stripe Billing + feature flags | PENDIENTE | sin Stripe por decision |
| FASE I | Maintenance crons | PENDIENTE | estructura inicial en src/maintenance |
| FASE J | ToS / Privacy en UI | PENDIENTE | |

## Estado funcional verificado

- Registro por email + confirmacion + login → funciona (Supabase Auth habilitado, SMTP del proyecto).
- Onboarding de tenant (RPC `crear_tenant_onboarding`) → crea tenant + owner.
- Shell con tabs (Inbox / IA / Canales / Ajustes) → navegacion cableada.
- **Toggles tema claro/oscuro + idioma ES/EN**: funcionales. El tema conmuta `html[data-theme]` (tokens OMEGA + tokens-light) y el idioma traduce la UI via i18n con re-render automatico (`hub:ui-changed`). Admin/switch en Ajustes sincronizados.
- Auditoria S1-S5 entregada en `AUDITORIA_S1_S5.md`; violaciones C4, capas y S1 resueltas.

## Auditoria S1-S5 (2026-10-13)

- C4: 0 archivos >75 lineas (se refactorizaron 6: contact, conversation, compliance entities, vertical-adapters, safe-evaluator, safe-governance).
- Capas DDD: 0 violaciones app->infra (AIProviderRegistry movido a domain; audit-logger usa repos inyectados).
- Lint: 0 errores, 0 warnings. Typecheck: 0 errores.
- S1: Source of Truth y GO_PRODUCTION actualizados.
- Deuda pendiente: cifrar `webhook_provider_configs.secret` (N4), ampliar tests de handlers, push GitHub requiere credenciales.

## Quality gates

- `pnpm typecheck` = 0 errores.
- `pnpm lint` = 0 errores, 0 warnings.
- `check:lines` / `check:layers` disponibles (bash).
- RLS: 45 tablas habilitadas con RLS, 51 policies, todas con tenant_id.

## Recordatorios operativos

- Aplicar migraciones: `supabase db push` (con `SUPABASE_DB_PASSWORD`).
- Reset de DB: `supabase db reset --linked`.
- Deploy frontend (desde apps/web o repo root): `npx vercel --prod --scope "raisen-s-projects"`.
- Rama de integracion: `develop`. Produccion estable: `main`.
- Push GitHub: requiere credenciales (Windows Credential Manager) desde terminal del owner.