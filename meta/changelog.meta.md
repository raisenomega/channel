# HUB — Changelog Maestro

> Registro append-only de cambios estructurales. Todos los commits siguen formato [FASE_N].

## Registro
- [2026-09-09] `docs` — Auditoría global FASES 1-11 contra checklist §2.1-2.5. SOT actualizado. 0 violaciones C1/C2/C4/A5. 18 tests, 101 TS, 17 migrations.
- [2026-09-09] `domain` `application` `safe` `schema` `testing` — **FASE 11**: SAFE governance (ensemble multi-proveedor, desacuerdo >30% bloquea, sampling 10%), autonomía progresiva 5 fases, kill switch, reporte semanal, FORTRESS audit. Migration 017.
- [2026-09-09] `domain` `application` `schema` `testing` — **FASE 10**: Compliance (consent tracking, privacy config, audit logs append-only 3 años, rate limiting, SB-1001 disclosure, SecureDelete, DataExport CSV/JSON). Migrations 015-016.
- [2026-09-09] `presentation` — **FASE 9**: Frontend TanStack Start + React (layout 3 paneles, inbox filters, chat thread, contact 360, channel settings, agent dashboard BYOK, dark/light mode, mobile responsive). hub_app.html interactivo.
- [2026-09-09] `domain` `application` `infra` `schema` — **FASE 8**: Integraciones ecosistema (7 gateways NUCLEO/OMEGA/POS/TABLE/HEALTH/HOME/FLEET, EventBus). Migration 014.
- [2026-09-09] `domain` `application` `infra` `schema` `testing` — **FASE 7**: BC cognition (AgentService, EthicsGuard, Confidence VO, ToolRegistry, AIProvider multi-proveedor Anthropic/DeepSeek/Qwen BYOK, DecideResponse/PostEnvioEval, PromptBuilder). Migrations 012-013.
- [2026-09-09] `domain` `application` `schema` `testing` — **FASE 6**: BC automation (Rules Engine 10 triggers, EvaluateRules, CheckSLA, CannedResponse). Migrations 010-011.
- [2026-09-09] `domain` `application` `infra` `schema` `testing` — **FASE 5**: BC commerce (Quote/Order/Payment entities con máquinas de estado, CreateQuote/AcceptQuote/ProcessPayment, StripeAdapter). Migrations 008-009.
- [2026-09-09] `domain` `application` `infra` `schema` `testing` — **FASE 4**: BC contacts (Contact entity, CreateContact/FindContact, Repo con pg_trgm fuzzy). Migrations 006-007.
- [2026-09-09] `domain` `application` `infra` `schema` `testing` — **FASE 3**: BC inbox (Conversation aggregate, Message entity, handlers, eventos snake_case). Migrations 004-005.
- [2026-09-09] `shared` — **i18n**: ES/EN completo (Language, Locale VO, TranslationProvider, 97 keys).
- [2026-09-09] `domain` `application` `infra` `testing` — **FASE 2**: BC channels (ChannelAdapter, Zernio/Resend/Webchat, ChannelRouter, handlers).
- [2026-09-09] `domain` `application` `infra` `schema` `testing` — **FASE 1**: BC identity (Tenant/User entities, handlers, repos Supabase). Migrations 001-003.
- [2026-09-09] `infra` — Gates endurecidos META-GATE (C4, A2, C1, C2). Scripts check-lines, check-layers, check-all, check-emojis.
- [2026-09-09] `docs` — FASE 0: Fundación, scaffolding DDD, shared kernel, remote channel.git, Plan Maestro.