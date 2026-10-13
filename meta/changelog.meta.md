# HUB — Changelog Maestro

> Registro append-only de cambios estructurales. Todos los commits siguen formato [FASE_N].

## Registro
- [2026-10-13] `docs` `meta` — **Protocolo de Auditoría Grado Bancario (P1 duro)**: nuevo `meta/auditoria.grado-bancario.meta.md` + `scripts/gate-grado-bancario.sh`. Obligatorio antes de cerrar/iniciar sesión/fase/implementación.
- [2026-10-13] `ui` — **Dashboard principal**: ficha 360 completa (cotizaciones/órdenes/pagos reales via RLS) + filtros de canal funcionales. Commit `e02415d`.
- [2026-09-09] `docs` `chore` — **Ley N5**: Prohibido datos seed/mock/placeholder. Eliminado seed.sql. Limpiados tests. Regla agregada al Plan Maestro y .gitignore.
- [2026-09-09] `infra` `docs` — **FASE C**: Variables de entorno (.env.development gitignorado + .env.example), supabase.client.ts con validación, setup-supabase.sh, deploy.sh.
- [2026-09-09] `infra` `docs` — **FASE B**: 17 down.sql, config.toml, reset-dev-db.sh, SETUP.md.
- [2026-09-09] `infra` `docs` — **FASE A**: Branching develop/staging, PR template, CONTRIBUTING.md, CI multi-branch.
- [2026-09-09] `docs` — Auditoría global FASES 1-11 contra checklist §2.1-2.5. SOT actualizado.
- ... (fases anteriores)