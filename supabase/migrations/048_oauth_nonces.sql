-- 048_oauth_nonces.sql  — HOTFIX N (N-9). ⚠️ NO APLICAR HASTA HOTFIX N.
-- Protección anti-replay para el state de OAuth (cierra D-06): nonce de un solo uso + TTL.
-- El handler verifica: nonce existe, no usado, no expirado -> marca used_at.
-- Idempotente (IF NOT EXISTS + DROP POLICY IF EXISTS). Sin BEGIN/COMMIT (leccion 044).
-- RLS deny-all: solo service_role (que bypasea RLS) escribe/lee; cero acceso directo cliente.

CREATE TABLE IF NOT EXISTS public.oauth_nonces (
  nonce       text PRIMARY KEY,
  tenant_id   uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  purpose     text NOT NULL DEFAULT 'oauth_state',
  created_at  timestamptz NOT NULL DEFAULT now(),
  used_at     timestamptz,
  expires_at  timestamptz NOT NULL DEFAULT now() + interval '10 minutes'
);

CREATE INDEX IF NOT EXISTS idx_oauth_nonces_expires ON public.oauth_nonces(expires_at);

ALTER TABLE public.oauth_nonces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS deny_all_oauth_nonces ON public.oauth_nonces;
CREATE POLICY deny_all_oauth_nonces ON public.oauth_nonces
  FOR ALL USING (false) WITH CHECK (false);

COMMENT ON TABLE public.oauth_nonces IS
  'Anti-replay del state OAuth (D-06). Single-use + TTL 10min. Solo service_role.';
