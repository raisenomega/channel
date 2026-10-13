# HUB — Source of Truth Canónico

> **Documento vivo**: refleja el estado real del proyecto HUB by Raisen.
> Última auditoría global: FASES 1-11 contra Plan Maestro + Checklist §2.1-2.5 (2026-10-13).

## [OK] FASE 0 — Fundación
Plan Maestro, repo + remote, scaffolding DDD (11 BCs, 4 capas), shared kernel, gates CI, .gitignore.

## [OK] FASE 1 — BC identity
Migrations 001-003 (tenants, users + RLS), Tenant entity, User entity, CreateTenant/CreateUser handlers, repos Supabase, tests.

## [OK] FASE 2 — BC channels
ChannelAdapter interface, Zernio/Resend/Webchat adapters, ChannelRouter, ConnectChannel/ProcessWebhook handlers, Inbox entity, tests.

## [OK] i18n — Internacionalización ES/EN
Language type, Locale VO, TranslationProvider, diccionario en frontend (apps/web/src/i18n.ts), entities con language.

## [OK] FASE 3 — BC inbox
Migrations 004-005 (conversations, messages, conversation_tags, conversation_participants + RLS), Conversation aggregate (maquina 5 estados), Message entity (AiMeta + 11 content types), eventos snake_case, Receive/Send/Assign/Resolve handlers, ListInbox query, repos Supabase, tests.

## [OK] FASE 4 — BC contacts
Migrations 006-007 (contacts + aux tables + RLS + pg_trgm), Contact entity (segmentos, LTV), CreateContact/FindContact handlers, ContactRepositorySupabase con fuzzy search. Tipos extraidos a contact.types.ts (C4).

## [OK] FASE 5 — BC commerce
Migrations 008-009 (quotes, orders, payments + RLS), Quote aggregate (5 estados), Order aggregate (6 estados), Payment entity (5 estados), CreateQuote/AcceptQuote/ProcessPayment handlers, StripeAdapter, Money VO, tests.

## [OK] FASE 6 — BC automation
Migrations 010-011 (automation_rules, sla_policies, business_hours, canned_responses + RLS), AutomationRule aggregate (10 triggers, 6 operadores), Rules Engine, EvaluateRules/CheckSLA/CannedResponse handlers, tests.

## [OK] FASE 7 — BC cognition
Migrations 012-013 (agent_interactions, agent_knowledge, agent_episodes, agent_graph_memory con pgvector, agent_autonomy_config, ai_provider_configs + RLS), AgentService, EthicsGuard (7 reglas), Confidence VO, ToolRegistry, AIProvider interface + AIProviderRegistry (interfaz en domain, impl en infrastructure), Anthropic/DeepSeek/Qwen adapters, DecideResponse/PostEnvioEval handlers, PromptBuilder. Tipos SAFE extraidos (C4).

## [OK] FASE 8 — Integraciones ecosistema
Migration 014 (integration_configs + sync_logs + RLS), 7 gateways (NUCLEO, OMEGA, POS, TABLE, HEALTH, HOME, FLEET), adapters separados por vertical (health/home/fleet.adapter.ts), EventBus publish/subscribe.

## [OK] FASE 9 — Frontend
Layout 3 paneles responsive, Inbox list con filtros, Chat thread con composer, Contact 360, Channel settings con BYOK, Agent dashboard, **dark/light mode + ES/EN funcionales via data-theme + i18n con re-render**, Mobile bottom nav. Vite + vanilla TS en apps/web. Desplegado en Vercel (channel-blue.vercel.app).

## [OK] FASE 10 — Compliance + Legal + Seguridad
Migrations 015-016 (consent_log, privacy_config, audit_logs, rate_limit_config + RLS), Consent tracking, PrivacyConfig, AuditLogger + repos Supabase (Consent/Audit/TenantDataPort en infrastructure), DataExport/CSV, SecureDelete, RateLimiter, Disclosure IA, OptIn/OptOut handlers.

## [OK] FASE 11 — SAFE Governance + Autonomía Progresiva
Migration 017 (safe_evaluations, autonomy_progression, safe_weekly_reports + RLS), SafePreSendHandler (ensemble multi-proveedor, desacuerdo >30% bloquea), SafePostSendHandler (sampling 10%), AutonomyProgression (5 fases 0-4 con thresholds), KillSwitch, WeeklyReportGenerator, FORTRESSAuditHandler, tests.

## Telemtría / Observabilidad
Logger estructurado (shared/infrastructure/logger.infrastructure.ts), Vigia panel en front (apps/web/src/vigia.ts), app_events table (migration 023), telemetria-client.

## Check de calidad global (auditoría 2026-10-13)
| Métrica | Resultado |
|---------|-----------|
| C1 (zero any) | 0 violaciones |
| C2 (zero @ts-ignore) | 0 violaciones |
| C4 (≤75 líneas) | 0 violaciones (6 corregidos: contact/conversation/compliance entities, vertical-adapters, safe-evaluator, safe-governance) |
| A1/A9 (capas DDD) | 0 violaciones (prompt-builder → interfaz en domain; audit-logger → repos inyectados) |
| A5 (Result sin throw) | 0 violaciones |
| N3 (RLS activo) | 22 migraciones, 45 tablas ENABLE RLS, 51 policies |
| Lint | 0 errores, 0 warnings (imports muertos limpiados) |
| TypeScript | strict, typecheck 0 errores |
| Migraciones SQL | 22 (001-023) |
| Toggles tema/idioma | funcionales (data-theme + i18n re-render) |

## [Ok] Nota N4 (secretos)
at-pending: webhook_provider_configs.secret se almacena como text (sin cifrado) — pendiente migrar a pgcrypto/pgsodium. ai_provider_configs.secrets_encrypted jsonb (OK nominal).

## [CHECk] FASE 12 — Enterprise (pendiente)
Multi-departamento, SSO/SAML, custom domains, white-label completo, Meta App Review, compliance MX/CO, penetración externa.

## Deuda conocida
- N4: webhook_provider_configs.secret en texto plano (pendiente de cifrar).
- Cobertura tests: varios handlers de application aún sin test unitario (inbox/agent/commerce).
- `git push` requiere credenciales GitHub desde terminal (funciona en maquina del owner).