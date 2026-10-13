-- FASE 5 — Orders y payments

CREATE TABLE public.orders (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  contact_id        uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  quote_id          uuid REFERENCES public.quotes(id),
  nucleo_order_id   uuid, nucleo_invoice_id uuid,
  status            text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','paid','shipped','delivered','cancelled')),
  total_amount      numeric(12,2) NOT NULL DEFAULT 0,
  currency          text NOT NULL DEFAULT 'USD',
  notes             text,
  ai_interaction_id uuid, ai_confidence numeric CHECK (ai_confidence BETWEEN 0 AND 1),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_tenant ON orders(tenant_id, status);
CREATE INDEX idx_orders_contact ON orders(contact_id);
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION _set_updated_at();
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_orders" ON orders FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());

CREATE TABLE public.order_line_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity    int NOT NULL CHECK (quantity > 0),
  unit_price  numeric(12,2) NOT NULL CHECK (unit_price >= 0),
  total       numeric(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);
ALTER TABLE public.order_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_order_items" ON order_line_items FOR ALL USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.tenant_id = current_tenant()));

CREATE TABLE public.payments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_id          uuid NOT NULL REFERENCES public.orders(id),
  amount            numeric(12,2) NOT NULL CHECK (amount > 0),
  currency          text NOT NULL DEFAULT 'USD',
  status            text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','completed','failed','refunded','disputed')),
  provider          text NOT NULL,
  provider_payment_id text,
  initiated_by_type text CHECK (initiated_by_type IN ('human','ai_agent','automation')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_tenant ON payments(tenant_id, status);
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION _set_updated_at();
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_payments" ON payments FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());

CREATE TABLE public.payment_methods_config (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider          text NOT NULL,
  config            jsonb NOT NULL DEFAULT '{}',
  secrets_encrypted jsonb NOT NULL DEFAULT '{}',
  is_active         boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_methods_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_payment_configs" ON payment_methods_config FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());