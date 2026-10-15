-- 027_signup_state_tokens.sql
-- Tokens CSRF (state) para el flujo Embedded Signup de Meta.
-- TTL de 10 minutos. Verificado en el callback OAuth.

CREATE TABLE signup_state_tokens (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id  TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  state      TEXT NOT NULL UNIQUE,
  app_id     TEXT NOT NULL,
  callback_url TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '10 minutes',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_signup_state_tokens_state ON signup_state_tokens(state);
CREATE INDEX idx_signup_state_tokens_tenant ON signup_state_tokens(tenant_id);
CREATE INDEX idx_signup_state_tokens_expires ON signup_state_tokens(expires_at);

-- RLS multi-tenant
ALTER TABLE signup_state_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY signup_state_tokens_tenant_isolation ON signup_state_tokens
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::TEXT);

CREATE POLICY signup_state_tokens_service_role ON signup_state_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Limpieza automatica de states expirados (opcional: corre como cron)
CREATE OR REPLACE FUNCTION cleanup_expired_signup_states()
RETURNS void AS $$
BEGIN
  DELETE FROM signup_state_tokens WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;