-- 062 — Agenda: citas/eventos del negocio (BC agenda).
-- Relaciona contacto, hilo (conversación), agente, cotización y orden.
-- Las relaciones de solo-lectura (pagos, documentos, notas de seguimiento,
-- estado del hilo + SLA) se leen por contact_id / conversation_id en el modal.
CREATE TABLE public.appointments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  contact_id      uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  agent_id        uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  quote_id        uuid REFERENCES public.quotes(id) ON DELETE SET NULL,
  order_id        uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  title           text NOT NULL,
  description     text,
  scheduled_at    timestamptz NOT NULL,
  ends_at         timestamptz,
  status          text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','confirmed','completed','cancelled','no_show')),
  channel         text CHECK (channel IN ('whatsapp','email','instagram','facebook','telegram','sms','x','linkedin','webchat','call','crm')),
  created_by_type text NOT NULL DEFAULT 'human' CHECK (created_by_type IN ('human','ai_agent')),
  location        text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_appointments_tenant_time ON public.appointments(tenant_id, scheduled_at);
CREATE INDEX idx_appointments_contact ON public.appointments(contact_id);
CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION _set_updated_at();
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_appointments" ON public.appointments FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());
