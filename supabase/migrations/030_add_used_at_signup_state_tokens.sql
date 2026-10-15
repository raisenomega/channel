-- 030_add_used_at_signup_state_tokens.sql
-- Agrega columna used_at para state single-use atomico.
-- Permite UPDATE ... SET used_at = now() WHERE used_at IS NULL AND expires_at > now() RETURNING ...

ALTER TABLE signup_state_tokens ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_signup_state_tokens_used_at ON signup_state_tokens(used_at);