# GO Production — HUB by Raisen

Estado de despliegue y avance hacia produccion. Documento de control de fases.

## Estado general

- Plataforma: HUB by Raisen (SaaS omnicanal con IA, multi-tenant).
- Backend: Supabase (Postgres + Auth) en `qbpzdoopruqbnerdcyfq.supabase.co`.
- Frontend: Vite (vanilla TS) desplegado en Vercel (`channel-blue.vercel.app`).
- Repo: github.com/raisenomega/channel, branches `develop`, `staging`, `main`.

## Fases del roadmap

| Fase | Descripcion | Estado | Notas |
|------|-------------|--------|-------|
| FASE 0-11 | Dominio, BC, migraciones, UI | COMPLETO | schema 001-022 aplicado |
| FASE A | Governance de ramas | COMPLETO | main/develop/staging |
| FASE B | Migraciones y rollback | COMPLETO | 22 migraciones + down |
| FASE C | Variables de entorno y scripts | COMPLETO | .env + scripts |
| FASE D | Login y autenticacion (Supabase Auth) | PARCIAL | registro con bloqueo pendiente |
| FASE E | Tenant onboarding (RPC crear_tenant) | PARCIAL | crea tenant; bloqueado por registro |
| FASE F | Monitoring + logging estructurado | COMPLETO | logger + captura de errores en front |
| FASE G | Integration tests | PENDIENTE | |
| FASE H | Stripe Billing + feature flags | PENDIENTE | |
| FASE I | Maintenance crons | PENDIENTE | |
| FASE J | ToS / Privacy en UI | PENDIENTE | |

## Fases D / E — Estado detallado

### Lo que funciona (verificado)
- Schema DB 001-022 aplicado al 100% via `supabase db reset --linked` (auditable).
- Frontend sirviendo en Vercel con identidad OMEGA (login/onboarding UI).
- RPCs de backend `crear_tenant_onboarding` y `mi_tenant` presentes en DB.
- `resolverTenant` corregido para usar el RPC `mi_tenant` (evita recursion del RLS de `users`).

### Bloqueo conocido (a validar)
- El registro en produccion no persiste la fila en `auth.users` de forma verificada en
  el entorno desplegado; el navegador conserva un token de una sesion previa.
  Impacto: el onboarding de tenant no puede completar el alta hasta resolverlo.
  No bloquea el avance de las fases restantes del roadmap.

### Decision CTO
- Se deja el registro como pendiente de validacion final (no detiene el roadmap).
- La base (schema, frontend, RPCs) queda congelada y verificable para continuar.

## FASE F — Siguiente a implementar

- Prioridad alta. Sin observabilidad no se diagnostican los problemas de produccion.
- Alcance: integracion de monitorizacion (Sentry) en front, logging en backend.

## FASE F — Completada

- Logging estructurado compartido en `src/shared/infrastructure/logger.infrastructure.ts`
  (niveles debug/info/warn/error, contexto fase/tenant/uid, funciona en backend y navegador).
- Monitor de errores globales del front en `apps/web/src/monitor.ts`
  (captura `window.onerror` y `unhandledrejection` con contexto).
- Integrado en el flujo de login/onboarding para capturar el error real del registro
  (lock objetivo: diagnosticar el bloqueo de Fase E con datos reales).
- `SENTRY_DSN` declarado en `.env.example` (pendiente de DSN real para Sentry).

## Recordatorios operativos

- Aplicar migraciones: `supabase db push` (con `SUPABASE_DB_PASSWORD`).
- Reset de DB: `supabase db reset --linked`.
- Deploy frontend (desde apps/web): `npx vercel --prod --scope "raisen-s-projects"`.
- Rama de integracion: `develop`. Produccion estable: `main`.