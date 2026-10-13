# HUB — Source of Truth Canónico

> **Documento vivo**: refleja el estado real del proyecto HUB by Raisen.
> Última auditoría global: FASES 1-11 contra Plan Maestro + Checklist §2.1-2.5 (2026-09-09).

## [OK] FASE 0 — Fundación
Plan Maestro, repo + remote, scaffolding DDD (11 BCs, 4 capas), shared kernel, gates CI, .gitignore.

## [OK] FASE 1 — BC identity
Migrations 001-003 (tenants, users + RLS), Tenant entity, User entity, CreateTenant/CreateUser handlers, repos Supabase, tests (5+5+2).

## [OK] FASE 2 — BC channels
ChannelAdapter interface, Zernio/Resend/Webchat adapters, ChannelRouter, ConnectChannel/ProcessWebhook handlers, Inbox entity, tests (5+4+2).

## [OK] i18n — Internacionalización ES/EN
Language type, Locale VO, TranslationProvider, 97 keys ES/EN, entities con language, tests (5).

## [OK] FASE 3 — BC inbox
Migrations 004-005 (conversations, messages particionada, conversation_tags, conversation_participants + RLS), Conversation aggregate (maquina 5 estados), Message entity (AiMeta + 11 content types), eventos snake_case, Receive/Send/Assign/Resolve handlers, ListInbox query, repos Supabase, tests (5+4+2).

## [OK] FASE 4 — BC contacts
Migrations 006-007 (contacts + aux tables + RLS + pg_trgm), Contact entity (consent, segment, LTV, 8 segmentos), CreateContact/FindContact handlers, ContactRepositorySupabase con fuzzy search, tests (5).

## [OK] FASE 5 — BC commerce
Migrations 008-009 (quotes, orders, payments + RLS), Quote aggregate (5 estados), Order aggregate (6 estados), Payment entity (5 estados), CreateQuote/AcceptQuote/ProcessPayment handlers, StripeAdapter, Money VO, tests (16).

## [OK] FASE 6 — BC automation
Migrations 010-011 (automation_rules, sla_policies, business_hours, canned_responses + RLS), AutomationRule aggregate (10 triggers, 6 operadores), Rules Engine, EvaluateRules/CheckSLA/CannedResponse handlers, tests (5).

## [OK] FASE 7 — BC cognition
Migrations 012-013 (agent_interactions, agent_knowledge, agent_episodes, agent_graph_memory con pgvector, agent_autonomy_config, ai_provider_configs + RLS), AgentService, EthicsGuard (7 reglas), Confidence VO (0/0.3/0.7/0.9/1.0), ToolRegistry (6 tools), AIProvider interface + AIProviderRegistry BYOK, Anthropic/DeepSeek/Qwen adapters, DecideResponse/PostEnvioEval handlers, PromptBuilder, tests (5).

## [OK] FASE 8 — Integraciones ecosistema
Migration 014 (integration_configs + sync_logs + RLS), 7 gateways (NUCLEO, OMEGA, POS, TABLE, HEALTH, HOME, FLEET), EventBus publish/subscribe, SyncFrom/SyncToNucleo handlers.

## [OK] FASE 9 — Frontend
Layout 3 paneles responsive, Inbox list con filtros, Chat thread con composer, Contact 360, Channel settings con BYOK, Agent dashboard metricas + autonomia, Dark/light mode, Mobile bottom nav. 6 archivos TypeScript frontend + hub_app.html interactivo.

## [OK] FASE 10 — Compliance + Legal + Seguridad
Migrations 015-016 (consent_log, privacy_config, audit_logs append-only 3 años, rate_limit_config + RLS), Consent tracking, PrivacyConfig, AuditLogger, DataExport/CSV, SecureDelete, RateLimiter, Disclosure IA (SB-1001), OptIn/OptOut handlers, tests (7).

## [OK] FASE 11 — SAFE Governance + Autonomía Progresiva
Migration 017 (safe_evaluations, autonomy_progression, safe_weekly_reports + RLS), SafePreSendHandler (ensemble multi-proveedor, desacuerdo >30% bloquea), SafePostSendHandler (sampling 10%), AutonomyProgression (5 fases 0-4 con thresholds), KillSwitch, WeeklyReportGenerator, FORTRESSAuditHandler, tests (7).

## Check de calidad global
| Métrica | Resultado |
|---------|-----------|
| C1 (zero any) | 0 violaciones |
| C2 (zero @ts-ignore) | 0 violaciones |
| C4 (≤75 líneas) | 0 violaciones |
| A5 (Result sin throw) | 0 violaciones |
| N3 (RLS activo) | 17 migraciones, 40+ policies |
| Commits formato [FASE_N] | 18/20 OK (2 corregidos) |
| Tests unitarios | 18 |
| Archivos TypeScript | 101 |
| Migraciones SQL | 17 |

## [--] FASE 12 — Enterprise (pendiente)
Multi-departamento, SSO/SAML, custom domains, white-label completo, Meta App Review, compliance MX/CO, penetración externa.