-- FASE 5 — BC commerce: quotes, orders, payments
-- Pipeline completo de ventas desde el chat

CREATE TABLE public.quotes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  contact_id        uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  mode              text NOT NULL DEFAULT 'lite' CHECK (mode IN ('lite','nucleo_synced')),
  nucleo_quote_id   uuid,
  status            text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','sent','accepted','rejected','expired')),
  total_amount      numeric(12,2) NOT NULL DEFAULT 0,
  currency          text NOT NULL DEFAULT 'USD',
  notes             text,
  created_by_type   text CHECK (created_by_type IN ('human','ai_agent')),
  ai_interaction_id uuid,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  expired_at        timestamptz
);
CREATE INDEX idx_quotes_tenant ON quotes(tenant_id, status);
CREATE INDEX idx_quotes_contact ON quotes(contact_id);
CREATE TRIGGER trg_quotes_updated_at BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION _set_updated_at();
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_quotes" ON quotes FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());

CREATE TABLE public.quote_line_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id    uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity    int NOT NULL CHECK (quantity > 0),
  unit_price  numeric(12,2) NOT NULL CHECK (unit_price >= 0),
  total       numeric(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);
ALTER TABLE public.quote_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_quote_items" ON quote_line_items FOR ALL USING (EXISTS (SELECT 1 FROM quotes q WHERE q.id = quote_id AND q.tenant_id = current_tenant()));