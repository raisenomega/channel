# HUB — Changelog Maestro

> Registro append-only de cambios estructurales. Orden descendente.

## Convención
`[FECHA] [TIPO] Descripción corta`
`TIPO` ∈ { `docs`, `schema`, `domain`, `application`, `infra`, `testing`, `breaking` }.

## Registro
- [2026-09-09] `docs` — **Auditoría comprensiva FASE 0-3 + i18n**: SOT actualizado, 0 violaciones en todas las reglas.
- [2026-09-09] `domain` `application` `infra` `schema` `testing` — **FASE 3**: BC inbox (conversation aggregate, message entity, handlers, repos Supabase, migrations 004-005, 11 tests).
- [2026-09-09] `shared` — **i18n**: Language type, Locale VO, TranslationProvider, 97 keys ES/EN, handlers con locale.
- [2026-09-09] `domain` `application` `infra` `testing` — **FASE 2**: BC channels (ChannelAdapter, Zernio/Resend/Webchat adapters, ChannelRouter, handlers, 11 tests).
- [2026-09-09] `domain` `application` `infra` `schema` `testing` — **FASE 1**: BC identity (tenant.entity, user.entity, handlers, repos Supabase, tests, migrations 001-003).
- [2026-09-09] `infra` — Gates endurecidos: META-GATE con C4 (75 líneas), A2 (capas DDD), C1, C2.
- [2026-09-09] `docs` — FASE 0: Fundación, scaffolding DDD, shared kernel, remote channel.git.
- [—] `docs` — Corrección contra docs fuente reales.
- [—] `docs` — Reconstrucción de Fase 0 bajo Cero Tolerancia (≤75 líneas/archivo).