-- 031_whatsapp_messages.sql
-- Tabla de mensajes WhatsApp (inbound + outbound) para Cloud API de Meta.
-- wamid es la clave de idempotencia.

CREATE TABLE whatsapp_messages (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id       TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  wamid           TEXT UNIQUE NOT NULL,
  phone_number_id TEXT NOT NULL,
  direction       TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_phone      TEXT NOT NULL,
  to_phone        TEXT NOT NULL,
  content_type    TEXT NOT NULL,
  content_body    JSONB NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending',
  error_code      TEXT,
  error_message   TEXT,
  sent_at         TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_whatsapp_messages_tenant ON whatsapp_messages(tenant_id);
CREATE INDEX idx_whatsapp_messages_wamid ON whatsapp_messages(wamid);
CREATE INDEX idx_whatsapp_messages_from_phone ON whatsapp_messages(from_phone);
CREATE INDEX idx_whatsapp_messages_created ON whatsapp_messages(created_at DESC);

ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY whatsapp_messages_tenant_isolation ON whatsapp_messages
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::TEXT);

CREATE POLICY whatsapp_messages_service_role ON whatsapp_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);