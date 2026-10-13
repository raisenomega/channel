# HUB — Source of Truth Canónico

> **Documento vivo**: refleja el estado real del proyecto HUB by Raisen.
> Auditado contra: `master_hub.md`, `AGENTE-IA-HUB.md`, `01_HUB_Data_Schema.md`, `HUB_DOCUMENTATION_MASTER_INDEX.md`, `hub_app.html`.

## ✅ FASE 0 — Fundación (completada)
- Plan Maestro de Construcción ✅
- Repo git + remote `github.com/raisenomega/channel.git` ✅
- Scaffolding DDD (11 BCs, 4 capas) ✅
- Shared kernel (Result, Email, Phone, Money, IDs, Types) ✅
- Gates CI endurecidos (C4, A2, C1, C2 — META-GATE) ✅
- `.gitignore` protege docs estratégicos ✅

## ✅ FASE 1 — BC identity + Supabase Schema (completada)
- Migración SQL: extensiones, helpers, tenants, users + RLS ✅
- Tenant entity (crearTenant con validaciones) ✅
- User entity (crearUser con Email VO + Role) ✅
- Identity repository (interfaces TenantRepository + UserRepository) ✅
- CreateTenant handler (1 caso de uso) ✅
- CreateUser handler (1 caso de uso) ✅
- Infrastructure: TenantRepositorySupabase + UserRepositorySupabase ✅
- Supabase client (shared/infrastructure) ✅
- Tests unitarios (tenant entity, user entity, create-tenant handler) ✅
- **Gates FASE 1: 0 violaciones (C4, C1, C2, A2, N3)** ✅

## ❌ FASE 2+ — No iniciadas
BC channels, inbox, contacts, commerce, automation, cognition, integrations, webchat, frontend, compliance/legal/seguridad.

## ⛔ Confidencialidad
Esta documentación vive SOLO en local. NO se commitea. Propiedad de raisen.agency.