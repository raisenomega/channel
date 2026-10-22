-- 067 — Alineacion EXACTA con Nucleo (la trilogia: Nucleo hace la contabilidad de HUB).
-- Espeja leads/lead_items/invoices/invoice_line_items y amplia quotes/quote_line_items a la forma de
-- Nucleo para que fusionen sin error. Las FKs a tablas solo-Nucleo (tenant_landing_products, income,
-- online_orders, payment categories) se dejan como uuid SIN FK para paridad de forma; se enlazan
-- cuando los esquemas fusionen. Aditivo e idempotente. RLS por tenant en todas.

-- ===== leads (espejo Nucleo) =====
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  contact_name text NOT NULL, phone text NOT NULL DEFAULT '', email text, address text, city text,
  service_requested text NOT NULL DEFAULT '',
  quoted_price numeric(12,2) CHECK (quoted_price IS NULL OR quoted_price >= 0),
  lead_source text NOT NULL DEFAULT '', temperature text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'Nuevo',
  attended_by uuid, call_date date NOT NULL DEFAULT current_date, call_time time, follow_up_date date,
  notes text, lost_reason text,
  created_by uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz, deleted_by uuid
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_leads ON public.leads;
CREATE POLICY tenant_isolation_leads ON public.leads FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());

-- ===== lead_items (espejo Nucleo, line_total generado) =====
CREATE TABLE IF NOT EXISTS public.lead_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  description text NOT NULL DEFAULT '', quantity numeric(12,2) NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0, tax_pct numeric(5,2) NOT NULL DEFAULT 0,
  discount_pct numeric(5,2) NOT NULL DEFAULT 0,
  line_total numeric(14,2) GENERATED ALWAYS AS (quantity * unit_price * (1 - discount_pct / 100) * (1 + tax_pct / 100)) STORED,
  sort int NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lead_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_lead_items ON public.lead_items;
CREATE POLICY tenant_isolation_lead_items ON public.lead_items FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());

-- ===== invoices (espejo Nucleo) =====
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  invoice_number text, client_name text NOT NULL DEFAULT '', phone text, email text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric(12,2) NOT NULL DEFAULT 0, tax numeric(12,2) NOT NULL DEFAULT 0, total numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
  due_date date, paid_at timestamptz, payment_method_id uuid,
  linked_income_id uuid, linked_lead_id uuid REFERENCES public.leads(id), linked_order_id uuid,
  notes text, created_by uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, invoice_number)
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_invoices ON public.invoices;
CREATE POLICY tenant_isolation_invoices ON public.invoices FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());

-- ===== invoice_line_items (espejo Nucleo) =====
CREATE TABLE IF NOT EXISTS public.invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_id uuid, description text NOT NULL DEFAULT '', quantity numeric(12,2) NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0, tax_pct numeric(5,2) NOT NULL DEFAULT 0,
  discount_pct numeric(5,2) NOT NULL DEFAULT 0, line_total numeric(12,2) NOT NULL DEFAULT 0,
  sort int NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_invoice_items ON public.invoice_line_items;
CREATE POLICY tenant_isolation_invoice_items ON public.invoice_line_items FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());

-- ===== quotes: ampliar a la forma de Nucleo (aditivo; HUB conserva contact_id/total_amount/currency) =====
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS quote_number text,
  ADD COLUMN IF NOT EXISTS client_name text, ADD COLUMN IF NOT EXISTS client_phone text,
  ADD COLUMN IF NOT EXISTS client_email text, ADD COLUMN IF NOT EXISTS client_address text,
  ADD COLUMN IF NOT EXISTS items jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS subtotal numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_total numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valid_until date, ADD COLUMN IF NOT EXISTS terms text,
  ADD COLUMN IF NOT EXISTS linked_lead_id uuid REFERENCES public.leads(id),
  ADD COLUMN IF NOT EXISTS linked_invoice_id uuid REFERENCES public.invoices(id),
  ADD COLUMN IF NOT EXISTS sent_at timestamptz, ADD COLUMN IF NOT EXISTS viewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS responded_at timestamptz;
ALTER TABLE public.quotes DROP CONSTRAINT IF EXISTS quotes_status_check;
ALTER TABLE public.quotes ADD CONSTRAINT quotes_status_check CHECK (status IN ('draft','sent','viewed','accepted','rejected','expired','converted'));

-- ===== quote_line_items: ampliar a la forma de Nucleo (aditivo) =====
ALTER TABLE public.quote_line_items
  ADD COLUMN IF NOT EXISTS tenant_id uuid, ADD COLUMN IF NOT EXISTS product_id uuid,
  ADD COLUMN IF NOT EXISTS tax_pct numeric(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_pct numeric(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS line_total numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sort int NOT NULL DEFAULT 0;
ALTER TABLE public.quote_line_items ALTER COLUMN quantity TYPE numeric(12,2);
