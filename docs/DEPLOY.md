# DEPLOY — HUB by Raisen

Backend: Railway, servicio `channel`, auto-deploy desde `develop`. Frontend: Vercel (`apps/tanstack`).
Este documento lista SOLO nombres de variables. Los valores viven en Railway/Vercel, nunca en el repo.

## Variables de entorno del backend (Railway)

| Variable | Obligatoria | Que pasa si falta |
|---|---|---|
| `SUPABASE_URL` | si | el proceso termina al arrancar (`supabase.client.ts`) |
| `SUPABASE_SERVICE_ROLE_KEY` | si | el proceso termina al arrancar |
| `SUPABASE_JWT_SECRET` | **si (Hotfix G)** | TODA ruta con JWT responde `500 {"error":{"kind":"config_incompleta"}}`. Detectado en prod 2026-10-16 con el smoke post-merge de Hotfix F; corregido por el owner en Railway ese mismo dia. |
| `ZERNIO_API_KEY` | si | ZernioAdapter no se registra: `/webhooks/zernio` responde `adapter_no_registrado` |
| `ZERNIO_WEBHOOK_SECRET` | si | igual que la anterior (Vault `get_secret` no existe; se usa env) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_API_VERSION` | si | rutas Stripe fallan |
| `CSRF_SECRET` | si | landing `/pay/*` no emite CSRF |
| `HUB_PUBLIC_URL` | si | redirect_uri OAuth incorrecto |
| `ATH_MOVIL_STUB` | solo test | en prod debe estar ausente |
| `PORT`, `HOST` | no | default 8080 / 0.0.0.0 |

Donde sale `SUPABASE_JWT_SECRET`: Supabase Dashboard, Settings, API, JWT Secret. Es el mismo secreto HS256
con el que Supabase firma los access tokens; el backend lo usa en `src/server/jwt-verify.ts`.

## Frontend (Vercel)

`apps/tanstack/index.html` inyecta `window.__HUB_CONFIG__` con `supabaseUrl`, `anonKey` y `hubApiUrl`.
`hubApiUrl` (Hotfix G) es la base del API en Railway: `vercel.json` reescribe TODO a `index.html`, asi que
un `fetch("/api/...")` relativo nunca llega al backend. `apps/tanstack/src/lib/api-client.ts` usa
`hubApiUrl` y adjunta `Authorization: Bearer <access_token de la sesion Supabase>`.

## Flujo de claims (Compuerta #17 + Hotfix G)

1. Login Supabase: el JWT trae `sub`. Si el usuario ya tiene tenant, trae `app_metadata.tenant_id`.
2. `POST /tenants` exige JWT valido pero NO `tenant_id` (`requireUserAuth`). Crea el tenant, la fila `users`
   con `id = sub` y rol `owner`, y escribe `app_metadata.tenant_id` via `auth.admin.updateUserById`.
3. El frontend refresca la sesion tras crear; el nuevo JWT ya trae `tenant_id`.
4. Toda ruta `/tenants/:id/*` exige `requireTenantAuth`: JWT valido y `claims.tenant_id === :id` (403 si no).

## Verificacion post-deploy (sin secretos)

```
curl.exe -s -o nul -w "%{http_code}" -X POST https://<railway>/tenants -H "Content-Type: application/json" -d "{}"
# 401 esperado (sin JWT). 500 config_incompleta = falta SUPABASE_JWT_SECRET.
curl.exe -s -o nul -w "%{http_code}" -X POST https://<railway>/tenants -H "Authorization: Bearer invalid" -d "{}"
# 401 firma_invalida esperado.
curl.exe -s -o nul -w "%{http_code}" -X POST https://<railway>/webhooks/zernio -H "X-Zernio-Signature: sha256=invalid" -d "{}"
# 401 signature_invalid esperado.
```
