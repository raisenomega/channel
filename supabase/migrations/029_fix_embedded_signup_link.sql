-- 029_fix_embedded_signup_link.sql
-- Agrega columnas para enlazar init con callback de Meta.
-- 1. meta_webhook_id en embedded_signups (el id que Meta envia en el webhook)
-- 2. signup_id en signup_state_tokens (para buscar el signup desde el state)
-- 3. unique index para busqueda por meta_webhook_id

ALTER TABLE embedded_signups ADD COLUMN IF NOT EXISTS meta_webhook_id TEXT;
CREATE INDEX IF NOT EXISTS idx_embedded_signups_meta_webhook ON embedded_signups(meta_webhook_id);

ALTER TABLE signup_state_tokens ADD COLUMN IF NOT EXISTS signup_id TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_signup_state_tokens_signup ON signup_state_tokens(signup_id);

-- Limpiar default despues de crear columna
ALTER TABLE signup_state_tokens ALTER COLUMN signup_id DROP DEFAULT;