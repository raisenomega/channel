-- ============================================================================
-- HUB by Raisen — Migración: channel_connections (Slide 4.2a)
-- Tabla de conexiones OAuth-por-red con RLS por tenant_id.
-- Idempotente. 7 plataformas soportadas (SOCIAL_PLATFORMS).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.channel_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('whatsapp','instagram','facebook','telegram','sms','x','linkedin')),
  zernio_account_id TEXT,
  handle TEXT,
  followers_count INTEGER,
  status TEXT NOT NULL DEFAULT 'awaiting' CHECK (status IN ('connected','awaiting','disconnected')),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  is_paused BOOLEAN NOT NULL DEFAULT FALSE,
  auto_publish_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, platform)
);

-- Índice para búsquedas por tenant
CREATE INDEX IF NOT EXISTS idx_channel_connections_tenant ON public.channel_connections(tenant_id);

ALTER TABLE public.channel_connections ENABLE ROW LEVEL SECURITY;

-- RLS: cada tenant ve solo sus propias conexiones
DROP POLICY IF EXISTS channel_connections_tenant_isolation ON public.channel_connections;
CREATE POLICY channel_connections_tenant_isolation ON public.channel_connections
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

COMMENT ON TABLE public.channel_connections IS
  'Conexiones OAuth por red social por tenant. 7 plataformas soportadas.';

-- ============================================================================
-- FIN Migración channel_connections
-- ============================================================================