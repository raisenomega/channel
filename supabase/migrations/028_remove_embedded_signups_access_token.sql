-- 028_remove_embedded_signups_access_token.sql
-- Elimina columna access_token de embedded_signups que era un landmine:
-- nunca se escribia ahi, daba falsa sensacion de seguridad.
-- Los tokens reales van en signup_tokens (encriptados via XChaCha20-Poly1305).

ALTER TABLE embedded_signups DROP COLUMN IF EXISTS access_token;
ALTER TABLE embedded_signups DROP COLUMN IF EXISTS access_token_expires_at;