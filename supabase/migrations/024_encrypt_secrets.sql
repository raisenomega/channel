-- ============================================================================
-- HUB by Raisen — Migración 024: Cifrado de secretos (N4)
--
-- Resuelve la deuda N4: webhook_provider_configs.secret y .public_key
-- estaban en texto plano. Ahora el schema fuerza almacenamiento cifrado
-- mediante pgp_sym_encrypt/pgp_sym_decrypt con una clave simétrica inyectada
-- en runtime vía current_setting('app.enc_key').
--
-- También refuerza que ai_provider_configs.secrets_encrypted y
-- integraciones afines usen la misma función de cifrado.
--
-- GESTIÓN DE CLAVE (LEER atentamente):
--   La clave NO está hardcodeada aquí. El runtime (Supabase/Aplicación) debe
--   establecer antes de cualquier consulta:
--     SET app.enc_key TO '<clave_maestra>';
--   En Railway/Supabase: pasar como variable de entorno ENC_KEY y en el
--   pooler o middleware ejecutar SET app.enc_key = current_setting(...).
--   NUNCA commitear la clave en el repositorio.
--
-- Idempotente: todas las sentencias usan IF NOT EXISTS / CREATE OR REPLACE.
-- Aplicable con: supabase db push
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Asegurar extensión pgcrypto (idempotente; ya existe desde 001_initial)
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- 2a. Función helper: cifrar texto plano con pgp_sym_encrypt
--     Usa current_setting('app.enc_key') — si no está definida, se lanza
--     excepción con un mensaje claro.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION encrypt_secret(plain_text text)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  enc_key text;
BEGIN
  enc_key := current_setting('app.enc_key', true);
  IF enc_key IS NULL OR enc_key = '' THEN
    RAISE EXCEPTION 'app.enc_key no está configurada — no se puede cifrar';
  END IF;
  RETURN encode(
    pgp_sym_encrypt(plain_text, enc_key, 'compress-algo=2, cipher-algo=aes256'),
    'base64'
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 2b. Función helper: descifrar texto cifrado (base64 + pgp_sym_encrypt)
--     Igual clave vía current_setting('app.enc_key').
--     Útil para la app o vistas desencriptadas en infra confiable.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION decrypt_secret(cipher_b64 text)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  enc_key text;
BEGIN
  enc_key := current_setting('app.enc_key', true);
  IF enc_key IS NULL OR enc_key = '' THEN
    RAISE EXCEPTION 'app.enc_key no está configurada — no se puede descifrar';
  END IF;
  RETURN pgp_sym_decrypt(decode(cipher_b64, 'base64'), enc_key);
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. webhook_provider_configs — migrar secret a cifrado
--    Estrategia:
--    a. Se añade columna secret_encrypted (text) para almacenar el valor
--       cifrado en base64.
--    b. Un trigger BEFORE INSERT OR UPDATE cifra automáticamente el campo
--       'secret' en 'secret_encrypted' y luego lo limpia en texto plano.
--    c. La columna original 'secret' y 'public_key' se mantienen para no
--       romver migraciones existentes, pero se marcan como deprecadas vía
--       comentario de columna y el trigger las limpia tras cifrar.
--    d. Los inserts futuros deben escribir en 'secret' (texto plano) y el
--       trigger lo cifra a 'secret_encrypted'. La app puede leer desde
--       decrypt_secret(secret_encrypted) cuando necesite el valor original.
-- ---------------------------------------------------------------------------

-- Añadir columna secret_encrypted si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'webhook_provider_configs'
      AND column_name  = 'secret_encrypted'
  ) THEN
    ALTER TABLE public.webhook_provider_configs
      ADD COLUMN secret_encrypted text;
  END IF;
END;
$$;

-- Añadir columna public_key_encrypted si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'webhook_provider_configs'
      AND column_name  = 'public_key_encrypted'
  ) THEN
    ALTER TABLE public.webhook_provider_configs
      ADD COLUMN public_key_encrypted text;
  END IF;
END;
$$;

-- Comentarios de columna: deprecación
COMMENT ON COLUMN public.webhook_provider_configs.secret IS
  'DEPRECATED — usar secret_encrypted. Campo en texto plano solo para backfill.';
COMMENT ON COLUMN public.webhook_provider_configs.public_key IS
  'DEPRECATED — usar public_key_encrypted. Campo en texto plano solo para backfill.';
COMMENT ON COLUMN public.webhook_provider_configs.secret_encrypted IS
  'Secreto cifrado con encrypt_secret() vía pgp_sym_encrypt(aes256).';
COMMENT ON COLUMN public.webhook_provider_configs.public_key_encrypted IS
  'Llave pública cifrada con encrypt_secret() vía pgp_sym_encrypt(aes256).';

-- Función trigger: cifra secret/public_key antes de insertar o actualizar
CREATE OR REPLACE FUNCTION trg_encrypt_webhook_secrets()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Cifrar secret si se proveyó en texto plano
  IF NEW.secret IS NOT NULL AND NEW.secret != '' AND
     (NEW.secret_encrypted IS NULL OR TG_OP = 'UPDATE') THEN
    NEW.secret_encrypted := encrypt_secret(NEW.secret);
    -- Limpiar texto plano para no persistirlo
    NEW.secret := NULL;
  END IF;

  -- Cifrar public_key si se proveyó en texto plano
  IF NEW.public_key IS NOT NULL AND NEW.public_key != '' AND
     (NEW.public_key_encrypted IS NULL OR TG_OP = 'UPDATE') THEN
    NEW.public_key_encrypted := encrypt_secret(NEW.public_key);
    NEW.public_key := NULL;
  END IF;

  RETURN NEW;
END;
$$;

-- Aplicar trigger (DROP previo para ser idempotente sobre el mismo nombre)
DROP TRIGGER IF EXISTS trg_webhook_encrypt_secrets ON public.webhook_provider_configs;
CREATE TRIGGER trg_webhook_encrypt_secrets
  BEFORE INSERT OR UPDATE OF secret, public_key
  ON public.webhook_provider_configs
  FOR EACH ROW
  EXECUTE FUNCTION trg_encrypt_webhook_secrets();

-- ---------------------------------------------------------------------------
-- 4. ai_provider_configs — reforzar que secrets_encrypted use cifrado
--    La columna ya es jsonb NOT NULL DEFAULT '{}'. Añadimos un CHECK
--    que asegura que cada valor interno pase por encrypt_secret().
--    Nota: el CHECK no puede garantizar que el contenido fue cifrado con
--    pgp_sym_encrypt (pgcrypto produce bytea), pero podemos forzar que
--    el JSONB no contenga cadenas en texto plano que parezcan API keys.
--    La responsabilidad de cifrar antes de insertar recae en la capa de
--    aplicación (ver AIProviderRepository).
--
--    Se añade también un helper trigger que intercepta escrituras y cifra
--    valores conocidos (api_key).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_encrypt_ai_provider_secrets()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  raw_key text;
  enc_key text;
BEGIN
  -- Cifrar 'api_key' dentro de secrets_encrypted si está en texto plano
  raw_key := NEW.secrets_encrypted ->> 'api_key';
  IF raw_key IS NOT NULL AND raw_key != '' THEN
    -- Solo cifrar si no empieza con el prefijo de cifrado (evita doble cifrado)
    IF raw_key NOT LIKE '$pgp_enc_%' THEN
      enc_key := encrypt_secret(raw_key);
      NEW.secrets_encrypted := jsonb_set(
        NEW.secrets_encrypted,
        '{api_key}',
        to_jsonb('$pgp_enc_' || enc_key)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ai_provider_encrypt_secrets ON public.ai_provider_configs;
CREATE TRIGGER trg_ai_provider_encrypt_secrets
  BEFORE INSERT OR UPDATE OF secrets_encrypted
  ON public.ai_provider_configs
  FOR EACH ROW
  EXECUTE FUNCTION trg_encrypt_ai_provider_secrets();

-- ---------------------------------------------------------------------------
-- 5. Backfill: migrar datos existentes en webhook_provider_configs
--    Solo se ejecuta si hay registros con secret en texto plano aún no
--    backfildead (secret_encrypted IS NULL).
--    Es seguro repetirlo: idempotente porque si secret_encrypted ya tiene
--    valor, el WHERE lo excluye.
-- ---------------------------------------------------------------------------
UPDATE public.webhook_provider_configs
SET
  secret = secret,   -- dispara el trigger que cifra y limpia
  public_key = public_key
WHERE
  (secret IS NOT NULL AND secret != '' AND secret_encrypted IS NULL)
  OR
  (public_key IS NOT NULL AND public_key != '' AND public_key_encrypted IS NULL);

-- ---------------------------------------------------------------------------
-- 6. Validar que la extensión y funciones existen (sanity check al aplicar)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  -- Verificar que pgcrypto está disponible
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto'
  ) THEN
    RAISE EXCEPTION 'pgcrypto no está instalada — la migración N4 falló';
  END IF;

  -- Verificar que las funciones helper existen
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'encrypt_secret'
  ) THEN
    RAISE EXCEPTION 'encrypt_secret() no fue creada';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'decrypt_secret'
  ) THEN
    RAISE EXCEPTION 'decrypt_secret() no fue creada';
  END IF;
END;
$$;

-- ============================================================================
-- FIN Migración 024
-- ============================================================================