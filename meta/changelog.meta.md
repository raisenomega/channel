# HUB — Changelog Maestro

> Registro append-only de cambios estructurales. Orden descendente.

## Convención
`[FECHA] [TIPO] Descripción corta`
`TIPO` ∈ { `docs`, `schema`, `domain`, `application`, `infra`, `testing`, `breaking` }.

## Registro
- [2026-09-09] `domain` `application` `infra` `schema` `testing` — **FASE 1**: BC identity completo (tenant.entity, user.entity, handlers, repos Supabase, tests, migrations 001-003).
- [2026-09-09] `infra` — Gates endurecidos: META-GATE con C4 (75 líneas), A2 (capas DDD), C1 (zero any), C2 (zero @ts-ignore).
- [2026-09-09] `docs` — FASE 0: Fundación, scaffolding DDD, shared kernel, remote github.com/raisenomega/channel.git.
- [—] `docs` — Corrección de alineación contra docs fuente reales (stack, BCs, canales, umbrales, ética, confidencialidad).
- [—] `docs` — Reconstrucción de Fase 0 bajo Cero Tolerancia (≤75 líneas/archivo).