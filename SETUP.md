# HUB by Raisen — Setup Guide

> Como levantar el proyecto HUB desde cero en un equipo nuevo.

---

## Requisitos

| Herramienta | Version | Como instalar |
|------------|---------|---------------|
| Node.js | 22+ | `winget install NodeJS` o `nvm install 22` |
| pnpm | 9+ | `npm install -g pnpm` |
| TypeScript | 5+ | `pnpm add -g typescript` |
| Supabase CLI | latest | `pnpm add -g supabase` |
| Deno | 2+ | `winget install deno` o `curl -fsSL https://deno.land/install.sh | sh` |
| Git | 2+ | `winget install git` |

> **Nota:** Deno solo es necesario para ejecutar los tests unitarios.
> El codigo backend compila con TypeScript puro.

---

## 1. Clonar el repositorio

```bash
git clone https://github.com/raisenomega/channel.git hub
cd hub
git checkout develop
```

## 2. Instalar dependencias

```bash
pnpm install
```

## 3. TypeScript check (verifica que todo compila)

```bash
pnpm typecheck
# Output: (silence = OK, no errors)
```

## 4. Ejecutar tests unitarios

```bash
pnpm test:unit
# Output: 18 tests passed
```

## 5. Verificar gates de calidad

```bash
pnpm check:all
# Output: todos los gates pasan
```

---

## Base de datos (opcional, sin DB real)

El proyecto funciona **sin base de datos real**. Las migraciones SQL en `supabase/migrations/` son el contrato.
El codigo se prueba contra interfaces de repositorio con mocks.

Para desarrollo local con Supabase:

### 5.1 Iniciar Supabase local

```bash
supabase init
supabase start
```

### 5.2 Vincular proyecto (solo una vez)

Necesitas las credenciales del proyecto Supabase:

```bash
supabase link --project-ref xxxxxxxxx
# Te pedira: URL + anon key + service role key
```

### 5.3 Ejecutar migrations

```bash
pnpm db:push
# Aplica las migraciones en orden de dependencia (001 → 020)
```

### 5.4 Reset / reconstrucción

```bash
pnpm db:reset
# Borra el esquema remoto y re-aplica todas las migraciones desde cero.
# No hay seed data (ley N5: datos simulados prohibidos).
```

### 5.5 Rollback (si algo falla)

```bash
# Los archivos de rollback (*.down.sql) viven en supabase/rollback/
# y se aplican en orden inverso al esquema.
pnpm db:reset
```

---

## Estructura del proyecto

```
channel/
├── src/                    # Backend TypeScript (DDD)
│   ├── shared/            # Shared kernel (Result, VOs, tipos)
│   ├── identity/          # BC identity (tenants, users)
│   ├── channels/          # BC channels (Zernio, Resend)
│   ├── inbox/             # BC inbox (conversations, messages)
│   ├── contacts/          # BC contacts (CRM Lite)
│   ├── commerce/          # BC commerce (quotes, orders, payments)
│   ├── automation/        # BC automation (rules, SLA, canned)
│   ├── cognition/         # BC cognition (agente IA)
│   ├── integrations/      # BC integrations (NUCLEO, OMEGA, POS, verticals)
│   └── compliance/        # BC compliance (consent, audit, rate limit)
├── apps/web/src/          # Frontend TanStack Start + React
├── supabase/migrations/   # Migraciones UP en orden de dependencia (001-020)
├── supabase/rollback/     # Migraciones DOWN (*.down.sql) para rollback
├── tests/                 # 18 tests unitarios
├── scripts/               # Gates CI + reset DB
├── ui/                    # Prototipo HTML interactivo
└── docs-hub/              # Documentacion estrategica (.gitignore)
```

---

## Flujo de trabajo diario

```bash
# 1. Actualizar develop
git checkout develop
git pull origin develop

# 2. Crear rama para tu feature
git checkout -b feature/mi-feature

# 3. Codificar...
# 4. Verificar gates
pnpm check:all

# 5. Ejecutar tests
pnpm test:unit

# 6. Commit y push
git add -A
git commit -m "[FASE_N] Descripcion del cambio"
git push origin feature/mi-feature

# 7. Crear Pull Request en GitHub contra develop
```

---

## Despliegue (sin DB real)

Actualmente el proyecto es **codigo listo para produccion pero sin infraestructura real conectada**.

### Para ver el prototipo HTML:

```bash
# Abrir en el navegador
start ui/hub_app.html
```

### Para compilar el frontend (cuando TanStack Start este configurado):

```bash
cd apps/web
pnpm build
# Output en apps/web/dist/
```

### Para deployar a Railway (backend):

```bash
# 1. Configurar variables de entorno en Railway
# 2. Conectar repositorio
# 3. Railway detecta automaticamente Node.js y ejecuta:
railway run --service hub-api
```

### Para deployar a Vercel (frontend):

```bash
# 1. Configurar Vercel project
# 2. Conectar apps/web/
# 3. Vercel detecta TanStack Start y despliega:
vercel --prod
```

---

## Canales (P1): simulacion vs reales

### Canal simulado (dev-channel) — funcionamiento en local

Para que **al menos un canal envíe un mensaje real** sin depender de proveedores
externos, existe el **canal simulado** (`src/channels/infrastructure/dev-channel.adapter.ts`).

- Su `sendMessage` **no hace fetch a una URL**: escribe el mensaje directamente en la
  tabla `messages` via Supabase (como si recibiera un mensaje de prueba local).
- Requiere configurar los ids de la conversacion/contacto/tenant de prueba en
  `.env.development` (se crean con `scripts/setup-canales.sh`):
  `DEV_CONVERSATION_ID`, `DEV_CONTACT_ID`, `DEV_TENANT_ID`.
- El composer del chat thread (`apps/web`) escribe en la misma tabla `messages`
  cuando `devChannelEnabled` esta activo en la config del frontend.

```bash
# Setup/credenciales del canal simulado
bash scripts/setup-canales.sh
```

### Canales reales (Zernio / Resend) — P1 pendiente de API keys reales

| Canal | Proveedor | Requerido para envio real |
|-------|-----------|---------------------------|
| WhatsApp / IG / FB / Telegram / SMS / X / LinkedIn | Zernio | `ZERNIO_API_KEY` real |
| Email | Resend | `RESEND_API_KEY` real |

> **P1:** Los adapters `zernio.adapter.ts` y `resend.adapter.ts` apuntan a URLs
> operativas de cada proveedor, pero **sin API keys reales no pueden enviar mensajes
> reales**. El `dev-channel` cubre ese hueco en desarrollo; el paso a producción
> requiere configurar las keys reales (nunca en el codigo, siempre en entorno).

---

## Variables de entorno requeridas (.env)

```bash
# Crear desde template
cp .env.example .env.development

# Editar con tus credenciales
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sbp_xxxxx
ZERNIO_API_KEY=zernio_xxxxx
RESEND_API_KEY=re_xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
APP_URL=http://localhost:3000
APP_ENV=development
```

---

## Resuelve problemas comunes

| Problema | Solucion |
|----------|----------|
| `tsc --noEmit` falla | Revisar que `strict: true` este en tsconfig. Correr `pnpm install` |
| Tests no pasan | `pnpm test:unit` requiere Deno instalado |
| `supabase db push` falla | Verificar `supabase link` y credenciales |
| `check:lines` falla | Hay un archivo >75 lineas. Ejecutar `scripts/check-lines.sh` para ver cual |
| `check:layers` falla | Una carpeta `domain/` importa de `infrastructure/` |

---

## Stack tecnologico

| Componente | Tecnologia |
|-----------|-----------|
| Backend | TypeScript (strict) + Node.js + Supabase |
| Frontend | TanStack Start + React 19 + Tailwind v4 + shadcn/ui |
| Base de datos | PostgreSQL + Supabase (+ pgvector, pg_trgm) |
| LLM | Anthropic Claude (default) / DeepSeek / Qwen (BYOK) |
| Canales v1 | Zernio (WhatsApp, IG, FB, Telegram, SMS, X, LinkedIn) |
| Email | Resend |
| Pagos | Stripe + ATH Movil (PR) |
| Monitoreo | Sentry + PostHog |
| CI/CD | GitHub Actions + Railway (backend) + Vercel (frontend) |

---

*Documento actualizado: 2026-09-09*
*Proyecto: github.com/raisenomega/channel.git*