-- HUB by Raisen — Pulido del badge: estado de lectura por usuario (no-leídos exactos y persistentes
-- entre dispositivos). Reemplaza el baseline por-viewer de localStorage. Cada operador guarda, por
-- clave de alerta (channel:whatsapp, crm:orders, ...), cuándo vio esa clave por última vez.
CREATE TABLE IF NOT EXISTS public.channel_read_state (
  tenant_id    uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL,            -- auth.uid() del operador
  scope_key    text NOT NULL,            -- 'channel:whatsapp', 'crm:orders', ...
  last_read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, user_id, scope_key)
);

ALTER TABLE public.channel_read_state ENABLE ROW LEVEL SECURITY;

-- Cada quien ve/escribe SOLO sus filas de su tenant.
DROP POLICY IF EXISTS read_state_isolation ON public.channel_read_state;
CREATE POLICY read_state_isolation ON public.channel_read_state FOR ALL
  USING (tenant_id = current_tenant() AND user_id = auth.uid())
  WITH CHECK (tenant_id = current_tenant() AND user_id = auth.uid());
