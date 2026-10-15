-- 032_notifications.sql
-- Notificaciones en tiempo real + preferencias por usuario. RLS multi-tenant.

CREATE TABLE notifications (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id     TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,
  severity      TEXT NOT NULL DEFAULT 'info',
  title         TEXT NOT NULL,
  body          TEXT,
  payload       JSONB,
  read_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_tenant_user ON notifications(tenant_id, user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

CREATE TABLE notification_preferences (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id       TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  in_app_enabled  BOOLEAN NOT NULL DEFAULT true,
  email_enabled   BOOLEAN NOT NULL DEFAULT false,
  push_enabled    BOOLEAN NOT NULL DEFAULT false,
  muted_types     TEXT[] NOT NULL DEFAULT '{}',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_tenant_isolation ON notifications
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::TEXT);
CREATE POLICY notifications_service_role ON notifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY notification_preferences_tenant_isolation ON notification_preferences
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::TEXT);
CREATE POLICY notification_preferences_service_role ON notification_preferences
  FOR ALL TO service_role USING (true) WITH CHECK (true);