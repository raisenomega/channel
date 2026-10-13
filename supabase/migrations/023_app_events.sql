-- ============================================================================
-- HUB by Raisen — Migración 023: telemetría de eventos del frontend
-- El vigía (observabilidad en vivo) publica eventos aqui para historico y
-- consulta posterior. Insert permitido a usuarios autenticados; lectura
-- restringida a superadmin (evita exponer datos de todos los tenants).
-- ============================================================================

CREATE TABLE public.app_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  user_id    uuid REFERENCES public.users(id) ON DELETE SET NULL,
  nivel      text NOT NULL DEFAULT 'info'
    CHECK (nivel IN ('debug','info','warn','error')),
  mensaje    text NOT NULL,
  fase       text,
  causa      text,
  url        text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_app_events_created ON app_events(created_at DESC);
CREATE INDEX idx_app_events_nivel ON app_events(nivel, created_at DESC);

ALTER TABLE public.app_events ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede registrar eventos (insercion).
CREATE POLICY "app_events_insert_auth" ON app_events FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Lectura solo para superadmin (traza global) o el usuario para su propio tenant.
CREATE POLICY "app_events_read_admin" ON app_events FOR SELECT
  USING ((is_superadmin() OR (user_id = auth.uid() OR tenant_id = current_tenant())));