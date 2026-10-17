-- ============================================================================
-- HUB by Raisen — Migración 043: RECONCILIACIÓN de schema de producción
--
-- Crea TODO lo que la auditoría E2E (2026-10-17) encontró AUSENTE en el
-- proyecto de prod `qbpzdoopruqbnerdcyfq`, verificado tabla/columna/función por
-- REST. Reemplaza el remedio peligroso de "concatenar 024-035" (que abortaría
-- en 025 por `CREATE TABLE whatsapp_templates` sobre tabla existente).
--
-- COBERTURA (solo lo genuinamente ausente):
--   024  -> funciones encrypt/decrypt + cols webhook_provider_configs + triggers
--   026  -> embedded_signups, signup_tokens  (forma FINAL = 026 + 028 + 029)
--   027  -> signup_state_tokens              (forma FINAL = 027 + 029 + 030)
--   031  -> whatsapp_messages
--   032  -> notifications, notification_preferences
--   033  -> payments.net_amount, payments.ath_auth_token_encrypted
--   035  -> rate_limit_counters + rate_limit_increment()
--
-- NO incluye 025/034/035-bis/036-042 (YA aplicadas) ni 021/crear_tenant_onboarding
-- (RPC muerto que el backend no usa).
--
-- ⚠️ DESVIACIÓN DELIBERADA vs los archivos originales (y POR QUÉ):
--   Las migraciones 026/027/031/032 declaraban `tenant_id TEXT REFERENCES
--   tenants(id)` y `id TEXT ... gen_random_uuid()::TEXT`. Pero tenants.id y
--   users.id son `uuid`. Un FK TEXT->uuid NO se puede crear
--   ("incompatible types text and uuid") => ESA es la razón real de que esas 4
--   nunca se aplicaran. Aquí se CORRIGE a `uuid`, igual que las tablas
--   sprint-4 que SÍ aplicaron (036 channel_connections, 038 agent_drafts).
--   RLS de aislamiento alineada al patrón real del proyecto:
--     (auth.jwt() ->> 'tenant_id')::uuid        (en vez del viejo
--      current_setting('app.current_tenant_id', TRUE)::TEXT).
--   `signup_state_tokens.signup_id` se mantiene TEXT (en el original no tiene
--   FK; es columna de búsqueda).
--
-- ⚠️ ADVERTENCIA (024): los triggers de cifrado llaman encrypt_secret(), que
--   LANZA EXCEPCIÓN si `app.enc_key` no está configurada en la sesión. Tras
--   aplicar esto, todo INSERT/UPDATE de webhook_provider_configs(secret) y
--   ai_provider_configs(secrets_encrypted.api_key) EXIGE app.enc_key. Ambas
--   tablas tienen 0 filas hoy. Si el runtime aún no setea app.enc_key, decidir
--   antes de aplicar (ver sección 1).
--
-- Idempotente (IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS).
-- Atomicidad: el CLI (`supabase db push`) envuelve cada migración en su propia
-- transacción. El bloque de verificación final hace RAISE EXCEPTION si falta
-- algo => la transacción del CLI hace ROLLBACK (cero estado a medias). Por eso
-- NO se usa BEGIN/COMMIT explícito aquí (chocaría con el wrapper del CLI).
-- Aplicar con: supabase db push
-- ============================================================================

-- ============================================================================
-- 1. [024] Cifrado de secretos: extensión + funciones + columnas + triggers
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION encrypt_secret(plain_text text)
RETURNS text LANGUAGE plpgsql STABLE AS $$
DECLARE enc_key text;
BEGIN
  enc_key := current_setting('app.enc_key', true);
  IF enc_key IS NULL OR enc_key = '' THEN
    RAISE EXCEPTION 'app.enc_key no está configurada — no se puede cifrar';
  END IF;
  RETURN encode(
    pgp_sym_encrypt(plain_text, enc_key, 'compress-algo=2, cipher-algo=aes256'),
    'base64'
  );
END; $$;

CREATE OR REPLACE FUNCTION decrypt_secret(cipher_b64 text)
RETURNS text LANGUAGE plpgsql STABLE AS $$
DECLARE enc_key text;
BEGIN
  enc_key := current_setting('app.enc_key', true);
  IF enc_key IS NULL OR enc_key = '' THEN
    RAISE EXCEPTION 'app.enc_key no está configurada — no se puede descifrar';
  END IF;
  RETURN pgp_sym_decrypt(decode(cipher_b64, 'base64'), enc_key);
END; $$;

ALTER TABLE public.webhook_provider_configs ADD COLUMN IF NOT EXISTS secret_encrypted text;
ALTER TABLE public.webhook_provider_configs ADD COLUMN IF NOT EXISTS public_key_encrypted text;

COMMENT ON COLUMN public.webhook_provider_configs.secret_encrypted IS
  'Secreto cifrado con encrypt_secret() vía pgp_sym_encrypt(aes256).';
COMMENT ON COLUMN public.webhook_provider_configs.public_key_encrypted IS
  'Llave pública cifrada con encrypt_secret() vía pgp_sym_encrypt(aes256).';

CREATE OR REPLACE FUNCTION trg_encrypt_webhook_secrets()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.secret IS NOT NULL AND NEW.secret != '' AND
     (NEW.secret_encrypted IS NULL OR TG_OP = 'UPDATE') THEN
    NEW.secret_encrypted := encrypt_secret(NEW.secret);
    NEW.secret := NULL;
  END IF;
  IF NEW.public_key IS NOT NULL AND NEW.public_key != '' AND
     (NEW.public_key_encrypted IS NULL OR TG_OP = 'UPDATE') THEN
    NEW.public_key_encrypted := encrypt_secret(NEW.public_key);
    NEW.public_key := NULL;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_webhook_encrypt_secrets ON public.webhook_provider_configs;
CREATE TRIGGER trg_webhook_encrypt_secrets
  BEFORE INSERT OR UPDATE OF secret, public_key
  ON public.webhook_provider_configs
  FOR EACH ROW EXECUTE FUNCTION trg_encrypt_webhook_secrets();

CREATE OR REPLACE FUNCTION trg_encrypt_ai_provider_secrets()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE raw_key text; enc_key text;
BEGIN
  raw_key := NEW.secrets_encrypted ->> 'api_key';
  IF raw_key IS NOT NULL AND raw_key != '' THEN
    IF raw_key NOT LIKE '$pgp_enc_%' THEN
      enc_key := encrypt_secret(raw_key);
      NEW.secrets_encrypted := jsonb_set(
        NEW.secrets_encrypted, '{api_key}', to_jsonb('$pgp_enc_' || enc_key)
      );
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_ai_provider_encrypt_secrets ON public.ai_provider_configs;
CREATE TRIGGER trg_ai_provider_encrypt_secrets
  BEFORE INSERT OR UPDATE OF secrets_encrypted
  ON public.ai_provider_configs
  FOR EACH ROW EXECUTE FUNCTION trg_encrypt_ai_provider_secrets();

-- ============================================================================
-- 2. [026 + 028 + 029] embedded_signups (forma final) + signup_tokens
--    tenant_id/id -> uuid (corrige el bug TEXT/uuid). Sin access_token (028).
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'embedded_signup_status') THEN
    CREATE TYPE embedded_signup_status AS ENUM
      ('CREATED','ATTEMPTED_REACH','COMPLETED','PENDING_DELETE','DELETED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.embedded_signups (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  waba_id                 text,
  phone_number_id         text,
  status                  embedded_signup_status NOT NULL DEFAULT 'CREATED',
  recipient_phone_number  text,
  legal_entity_name       text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  completed_at            timestamptz,
  meta_business_id        text,
  meta_account_id         text,
  error_message           text,
  meta_webhook_id         text
);

CREATE TABLE IF NOT EXISTS public.signup_tokens (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  signup_id       uuid NOT NULL REFERENCES public.embedded_signups(id) ON DELETE CASCADE,
  encrypted_nonce text NOT NULL,
  encrypted_token text NOT NULL,
  key_version     integer NOT NULL DEFAULT 1,
  token_type      text NOT NULL DEFAULT 'system_user',
  expires_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  rotated_at      timestamptz
);

CREATE INDEX IF NOT EXISTS idx_embedded_signups_tenant ON public.embedded_signups(tenant_id);
CREATE INDEX IF NOT EXISTS idx_embedded_signups_status ON public.embedded_signups(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_embedded_signups_waba ON public.embedded_signups(tenant_id, waba_id) WHERE waba_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_embedded_signups_meta_webhook ON public.embedded_signups(meta_webhook_id);
CREATE INDEX IF NOT EXISTS idx_signup_tokens_tenant ON public.signup_tokens(tenant_id);
CREATE INDEX IF NOT EXISTS idx_signup_tokens_signup ON public.signup_tokens(signup_id);

ALTER TABLE public.embedded_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signup_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS embedded_signups_tenant_isolation ON public.embedded_signups;
CREATE POLICY embedded_signups_tenant_isolation ON public.embedded_signups
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
DROP POLICY IF EXISTS embedded_signups_service_role ON public.embedded_signups;
CREATE POLICY embedded_signups_service_role ON public.embedded_signups
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS signup_tokens_tenant_isolation ON public.signup_tokens;
CREATE POLICY signup_tokens_tenant_isolation ON public.signup_tokens
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
DROP POLICY IF EXISTS signup_tokens_service_role ON public.signup_tokens;
CREATE POLICY signup_tokens_service_role ON public.signup_tokens
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION update_embedded_signup_timestamp()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_embedded_signups_updated_at ON public.embedded_signups;
CREATE TRIGGER trg_embedded_signups_updated_at
  BEFORE UPDATE ON public.embedded_signups
  FOR EACH ROW EXECUTE FUNCTION update_embedded_signup_timestamp();

-- ============================================================================
-- 3. [027 + 029 + 030] signup_state_tokens (forma final)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.signup_state_tokens (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  state        text NOT NULL UNIQUE,
  app_id       text NOT NULL,
  callback_url text NOT NULL,
  expires_at   timestamptz NOT NULL DEFAULT now() + interval '10 minutes',
  created_at   timestamptz NOT NULL DEFAULT now(),
  signup_id    text NOT NULL,          -- 029: columna de búsqueda, sin FK
  used_at      timestamptz             -- 030: single-use atómico
);

CREATE INDEX IF NOT EXISTS idx_signup_state_tokens_state   ON public.signup_state_tokens(state);
CREATE INDEX IF NOT EXISTS idx_signup_state_tokens_tenant  ON public.signup_state_tokens(tenant_id);
CREATE INDEX IF NOT EXISTS idx_signup_state_tokens_expires ON public.signup_state_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_signup_state_tokens_signup  ON public.signup_state_tokens(signup_id);
CREATE INDEX IF NOT EXISTS idx_signup_state_tokens_used_at ON public.signup_state_tokens(used_at);

ALTER TABLE public.signup_state_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS signup_state_tokens_tenant_isolation ON public.signup_state_tokens;
CREATE POLICY signup_state_tokens_tenant_isolation ON public.signup_state_tokens
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
DROP POLICY IF EXISTS signup_state_tokens_service_role ON public.signup_state_tokens;
CREATE POLICY signup_state_tokens_service_role ON public.signup_state_tokens
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION cleanup_expired_signup_states()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN DELETE FROM public.signup_state_tokens WHERE expires_at < now(); END; $$;

-- ============================================================================
-- 4. [031] whatsapp_messages
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  wamid           text UNIQUE NOT NULL,
  phone_number_id text NOT NULL,
  direction       text NOT NULL CHECK (direction IN ('inbound','outbound')),
  from_phone      text NOT NULL,
  to_phone        text NOT NULL,
  content_type    text NOT NULL,
  content_body    jsonb NOT NULL,
  status          text NOT NULL DEFAULT 'pending',
  error_code      text,
  error_message   text,
  sent_at         timestamptz,
  delivered_at    timestamptz,
  read_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_tenant     ON public.whatsapp_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_wamid      ON public.whatsapp_messages(wamid);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_from_phone ON public.whatsapp_messages(from_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created    ON public.whatsapp_messages(created_at DESC);

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS whatsapp_messages_tenant_isolation ON public.whatsapp_messages;
CREATE POLICY whatsapp_messages_tenant_isolation ON public.whatsapp_messages
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
DROP POLICY IF EXISTS whatsapp_messages_service_role ON public.whatsapp_messages;
CREATE POLICY whatsapp_messages_service_role ON public.whatsapp_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- 5. [032] notifications + notification_preferences
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type       text NOT NULL,
  severity   text NOT NULL DEFAULT 'info',
  title      text NOT NULL,
  body       text,
  payload    jsonb,
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_tenant_user ON public.notifications(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  in_app_enabled boolean NOT NULL DEFAULT true,
  email_enabled  boolean NOT NULL DEFAULT false,
  push_enabled   boolean NOT NULL DEFAULT false,
  muted_types    text[] NOT NULL DEFAULT '{}',
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_tenant_isolation ON public.notifications;
CREATE POLICY notifications_tenant_isolation ON public.notifications
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
DROP POLICY IF EXISTS notifications_service_role ON public.notifications;
CREATE POLICY notifications_service_role ON public.notifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS notification_preferences_tenant_isolation ON public.notification_preferences;
CREATE POLICY notification_preferences_tenant_isolation ON public.notification_preferences
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
DROP POLICY IF EXISTS notification_preferences_service_role ON public.notification_preferences;
CREATE POLICY notification_preferences_service_role ON public.notification_preferences
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- 6. [033] payments: columnas ATH Móvil
-- ============================================================================
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS net_amount numeric(12,2);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS ath_auth_token_encrypted text;
COMMENT ON COLUMN public.payments.net_amount IS
  'Importe neto tras fee (ATH descuenta 2.25%). Se persiste al confirmar COBRADO.';
COMMENT ON COLUMN public.payments.ath_auth_token_encrypted IS
  'JWT transitorio de ATH cifrado con encrypt_secret(). Efímero; se limpia al COMPLETED/CANCEL.';

-- ============================================================================
-- 7. [035] rate_limit_counters + rate_limit_increment()
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.rate_limit_counters (
  ip           text NOT NULL,
  path         text NOT NULL,
  window_start timestamptz NOT NULL,
  count        int NOT NULL DEFAULT 1,
  PRIMARY KEY (ip, path, window_start)
);
CREATE INDEX IF NOT EXISTS idx_rate_limit_window ON public.rate_limit_counters(window_start);
ALTER TABLE public.rate_limit_counters DISABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.rate_limit_counters IS
  'Contadores de rate limit por (ip, path) y ventana de 1 minuto. Rutas públicas.';

CREATE OR REPLACE FUNCTION public.rate_limit_increment(p_ip text, p_path text)
RETURNS int LANGUAGE plpgsql VOLATILE AS $$
DECLARE w timestamptz := date_trunc('minute', now()); c int;
BEGIN
  INSERT INTO public.rate_limit_counters (ip, path, window_start, count)
  VALUES (p_ip, p_path, w, 1)
  ON CONFLICT (ip, path, window_start)
  DO UPDATE SET count = public.rate_limit_counters.count + 1
  RETURNING count INTO c;
  RETURN c;
END; $$;
GRANT EXECUTE ON FUNCTION public.rate_limit_increment(text, text) TO service_role;

-- ============================================================================
-- 8. VERIFICACIÓN — aborta (ROLLBACK) si algo quedó fuera
-- ============================================================================
DO $$
DECLARE
  faltan text := '';
  t text;
  f text;
BEGIN
  -- Tablas que deben existir
  FOREACH t IN ARRAY ARRAY[
    'embedded_signups','signup_tokens','signup_state_tokens',
    'whatsapp_messages','notifications','notification_preferences',
    'rate_limit_counters'
  ] LOOP
    IF to_regclass('public.' || t) IS NULL THEN faltan := faltan || ' tabla:' || t; END IF;
  END LOOP;

  -- Columnas que deben existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='webhook_provider_configs' AND column_name='secret_encrypted') THEN faltan := faltan || ' col:webhook_provider_configs.secret_encrypted'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='webhook_provider_configs' AND column_name='public_key_encrypted') THEN faltan := faltan || ' col:webhook_provider_configs.public_key_encrypted'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='net_amount') THEN faltan := faltan || ' col:payments.net_amount'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='ath_auth_token_encrypted') THEN faltan := faltan || ' col:payments.ath_auth_token_encrypted'; END IF;

  -- Funciones que deben existir
  FOREACH f IN ARRAY ARRAY[
    'encrypt_secret','decrypt_secret','rate_limit_increment',
    'cleanup_expired_signup_states','update_embedded_signup_timestamp',
    'trg_encrypt_webhook_secrets','trg_encrypt_ai_provider_secrets'
  ] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = f) THEN faltan := faltan || ' fn:' || f; END IF;
  END LOOP;

  IF faltan <> '' THEN
    RAISE EXCEPTION 'RECONCILE 043 INCOMPLETO -> falta:%', faltan;
  END IF;
  RAISE NOTICE 'RECONCILE 043 OK: 7 tablas + 4 columnas + 7 funciones presentes.';
END $$;

-- ============================================================================
-- FIN Migración 043
-- ============================================================================
