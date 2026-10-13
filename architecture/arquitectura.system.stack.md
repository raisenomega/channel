# Arquitectura — Stack Tecnológico (canónico Raisen)

> Stack idéntico a NÚCLEO. Repo: `github.com/raisenomega/hub` (privado).

## Frontend
- **TanStack Start v1** — framework fullstack React (SSR + streaming)
- **React 19** · **Tailwind CSS v4** · **shadcn/ui**
- **Recharts** (reportes) · **TanStack Query** (data fetching)

## Backend / Infraestructura
- **Railway** — compute: workers, crons, webhook processors, orquestador de agentes
- **Supabase** — PostgreSQL + RLS, Auth master, Storage, Realtime, Edge Functions
- **Vercel** — hosting frontend

## Proveedores externos
| Rol | Proveedor |
|---|---|
| Canales v1 | **Zernio** (WhatsApp, IG, FB, Telegram, SMS, X, LinkedIn) |
| Email | **Resend** (send + receive webhooks) |
| Pagos | Stripe + ATH Móvil (PR) |
| LLM oficial | **Anthropic Claude** (mismo proveedor que NÚCLEO) |
| Observabilidad | Sentry + PostHog |

## Restricciones (DDD Cero Tolerancia)
- `any` prohibido. Inmutabilidad con `readonly` + `Object.freeze`.
- Efectos secundarios solo en adapters de `infrastructure`.
- Archivos ≤ 75 líneas.
