# HUB — Source of Truth Canónico

> **Documento vivo**: refleja el estado real del proyecto HUB by Raisen.
> Última auditoría: comprensiva contra Plan Maestro de Construcción (2026-09-09).

## ✅ FASE 0 — Fundación (completada y auditada)
- Plan Maestro de Construcción ✅ (12 fases, reglas innegociables, checklist, scaffolding)
- Repo git + remote `github.com/raisenomega/channel.git` ✅
- Scaffolding DDD (11 BCs, 4 capas: domain/application/infrastructure/presentation) ✅
- Shared kernel (Result, Email, Phone, Money, IDs, Types, Locale, TranslationProvider) ✅
- Gates CI endurecidos (C4, A2, C1, C2 — META-GATE check-all.sh) ✅
- `.gitignore` protege docs estratégicos ✅

## ✅ FASE 1 — BC identity + Supabase Schema (completada y auditada)
- Migraciones 001-003: extensiones, helpers globales, tenants, users + RLS ✅
- Tenant entity (crearTenant con language, validaciones, slug) ✅
- User entity (crearUser con Email VO + Role + Language) ✅
- Identity repository (interfaces TenantRepository + UserRepository) ✅
- CreateTenant + CreateUser handlers (1 caso de uso c/u) ✅
- Repositorios Supabase con mapeo snake_case↔camelCase ✅
- Tests: tenant.entity (5), user.entity (5), create-tenant.handler (2) ✅
- **Gates: 0 violaciones** ✅

## ✅ FASE 2 — BC channels (completada y auditada)
- ChannelAdapter interface (sendMessage, sendTemplate, parseInboundWebhook, verifyWebhook, ping) ✅
- ZernioAdapter: 7 canales (WhatsApp, IG, FB, Telegram, SMS, X, LinkedIn) ✅
- ResendAdapter: 1 canal (email) ✅
- NativeWebchatAdapter: 1 canal (webchat) ✅
- Inbox entity (crearInbox, activarInbox, desactivarInbox, ProviderType) ✅
- ChannelRouter (resolver adapter, enrutar mensaje por canal) ✅
- ConnectChannel + ProcessWebhook handlers (1 caso de uso c/u) ✅
- Tests: inbox.entity (5), channel.router (4), connect-channel.handler (2) ✅
- **Gates: 0 violaciones** ✅

## ✅ i18n — Internacionalización ES/EN (completada y auditada)
- Language type ("es" | "en"), Locale VO + validación ✅
- TranslationProvider + TranslationMap + factory con parámetros ({agent}, {n}) ✅
- 3 pares de archivos de traducciones (6 archivos, 97 keys por idioma) ✅
- Tenant y User entities con campo language + validación ✅
- Handlers y repositorios con persistencia de language ✅
- Tests de traducciones (5 tests: ES, EN, key inexistente, parámetros, mismas keys) ✅
- **Gates: 0 violaciones** ✅

## ✅ FASE 3 — BC inbox (completada y auditada)
- Migraciones 004-005: conversations (30+ columnas), messages (particionada), conversation_tags, conversation_participants + RLS ✅
- Conversation entity (crearConversacion + máquina de estados con 5 status + transiciones) ✅
- Message entity (crearMensaje + AiMeta + 11 content types + senderType + status) ✅
- Eventos snake_case (conversation.created, message.received, conversation.assigned...) ✅
- ConversationRepository + MessageRepository interfaces ✅
- ReceiveMessage handler (busca o crea conversación por contacto+canal) ✅
- SendMessage handler (valida estado, registra IA traceability) ✅
- AssignConversation + ResolveConversation handlers ✅
- ListInbox query (filtra por estado, activas primero, con límite) ✅
- Repositorios Supabase con mappers separados ✅
- Tests: conversation.entity (5), message.entity (4), resolve-conversation.handler (2) ✅
- **Gates: 0 violaciones** ✅

## 📊 Resumen de métricas
| Métrica | Valor |
|---------|-------|
| Archivos TypeScript | 45 |
| Tests unitarios | 16 (en 6 suites) |
| Migraciones SQL | 5 |
| Archivos documentación | 137 .md |
| Commits | 6 |
| Regla C4 (≤75 líneas) | 0 violaciones |
| Regla C1 (zero any) | 0 violaciones |
| Regla C2 (zero @ts-ignore) | 0 violaciones |
| Regla C5 (side-effects en infra) | 0 violaciones |
| Regla A2 (domain puro) | 0 violaciones |
| Regla A5 (Result sin throw) | 0 violaciones |
| Regla A8 (mappers en infra) | 0 violaciones |
| RLS activo en migraciones | 4 tablas |

## ❌ FASE 4+ — Pendientes
- BC contacts (CRM Lite)
- BC commerce (quotes/orders/payments)
- BC automation (rules/SLA/business-hours)
- BC cognition (agente IA multi-proveedor)
- BC integrations (NÚCLEO/OMEGA/POS/verticales)
- BC webchat (widget)
- Frontend (TanStack Start + React)
- Compliance legal (ToS/DPA/SLA/privacidad en código)
- Seguridad (BCP/DRP en código)

## ⛔ Confidencialidad
Esta documentación vive SOLO en local. NO se commitea. Propiedad de raisen.agency.