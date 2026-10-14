-- 026_embedded_signup_oauth.sql
-- Schema para Embedded Signup de Meta (WhatsApp Business Platform)
-- Crea tabla embedded_signups + sistema de tokens + RLS multi-tenant

-- ---------------------------------------------------------------
-- 1. Estados del flujo Embedded Signup
-- ---------------------------------------------------------------
CREATE TYPE embedded_signup_status AS ENUM (
  'CREATED',
  'ATTEMPTED_REACH',
  'COMPLETED',
  'PENDING_DELETE',
  'DELETED'
);

-- ---------------------------------------------------------------
-- 2. Tabla principal embedded_signups
-- ---------------------------------------------------------------
CREATE TABLE embedded_signups (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id       TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  waba_id         TEXT,
  phone_number_id TEXT,
  status          embedded_signup_status NOT NULL DEFAULT 'CREATED',
  -- Datos del webhook de Meta
  access_token         TEXT,                 -- System User Token (encriptado via Vault real)
  access_token_expires_at TIMESTAMPTZ,
  recipient_phone_number TEXT,              -- Teléfono del negocio
  legal_entity_name     TEXT,
  -- Timestamps
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  -- Meta fields (del callback)
  meta_business_id       TEXT,
  meta_account_id        TEXT,
  -- Audit
  error_message TEXT
);

-- ---------------------------------------------------------------
-- 3. Tokens encriptados (alternativa simple a Vault si no disponible)
-- ---------------------------------------------------------------
CREATE TABLE signup_tokens (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id       TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  signup_id       TEXT NOT NULL REFERENCES embedded_signups(id) ON DELETE CASCADE,
  -- Token encriptado (XChaCha20-Poly1305) como hex
  encrypted_nonce       TEXT NOT NULL,  -- nonce de 24 bytes en hex
  encrypted_token       TEXT NOT NULL,  -- ciphertext (incluye tag Poly1305) en hex
  token_type            TEXT NOT NULL DEFAULT 'system_user',
  expires_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  rotated_at            TIMESTAMPTZ
);

-- ---------------------------------------------------------------
-- 4. Índices y constraints
-- ---------------------------------------------------------------
CREATE INDEX idx_embedded_signups_tenant ON embedded_signups(tenant_id);
CREATE INDEX idx_embedded_signups_status ON embedded_signups(status);
CREATE UNIQUE INDEX idx_embedded_signups_waba ON embedded_signups(tenant_id, waba_id) WHERE waba_id IS NOT NULL;

CREATE INDEX idx_signup_tokens_tenant ON signup_tokens(tenant_id);
CREATE INDEX idx_signup_tokens_signup ON signup_tokens(signup_id);

-- ---------------------------------------------------------------
-- 5. RLS (Row Level Security) — multi-tenant
-- ---------------------------------------------------------------
ALTER TABLE embedded_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE signup_tokens ENABLE ROW LEVEL SECURITY;

-- Política: solo el tenant dueño puede ver sus signups
CREATE POLICY embedded_signups_tenant_isolation ON embedded_signups
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::TEXT);

CREATE POLICY signup_tokens_tenant_isolation ON signup_tokens
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::TEXT);

-- Política: service_role puede todo (para los schedulers)
CREATE POLICY embedded_signups_service_role ON embedded_signups
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY signup_tokens_service_role ON signup_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------
-- 6. Función helper: actualizar updated_at automáticamente
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_embedded_signup_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_embedded_signups_updated_at
  BEFORE UPDATE ON embedded_signups
  FOR EACH ROW
  EXECUTE FUNCTION update_embedded_signup_timestamp();

-- ---------------------------------------------------------------
-- 7. Verificación: migración aplicada
-- ---------------------------------------------------------------
INSERT INTO _migrations (name, applied_at) VALUES (
  '026_embedded_signup_oauth',
  now()
);