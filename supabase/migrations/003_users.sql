-- 4. TABLA users — usuarios del sistema (compartida ecosistema vía auth master)
CREATE TABLE public.users (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id  uuid REFERENCES public.tenants(id),
  email      text NOT NULL UNIQUE,
  full_name  text,
  display_name text,
  avatar_url text,
  phone      text,
  role       text NOT NULL DEFAULT 'agent'
    CHECK (role IN ('owner','admin','supervisor','agent','viewer','superadmin')),
  permissions jsonb NOT NULL DEFAULT '{}',
  language   text NOT NULL DEFAULT 'es',
  timezone   text NOT NULL DEFAULT 'America/Puerto_Rico',
  notification_preferences jsonb NOT NULL DEFAULT '{}',
  is_active  boolean NOT NULL DEFAULT true,
  is_online  boolean NOT NULL DEFAULT false,
  last_seen_at  timestamptz,
  last_login_at timestamptz,
  onboarded_at  timestamptz,
  onboarding_completed_steps jsonb DEFAULT '[]',
  mfa_enabled   boolean NOT NULL DEFAULT false,
  password_changed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);
CREATE INDEX idx_users_tenant ON users(tenant_id) WHERE archived_at IS NULL;
CREATE INDEX idx_users_email ON users(email) WHERE archived_at IS NULL;
CREATE INDEX idx_users_role ON users(tenant_id, role) WHERE archived_at IS NULL;
CREATE INDEX idx_users_online ON users(tenant_id, is_online) WHERE is_online = true;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

-- 4b. HELPERS GLOBALES (reemplazan las stubs de 001_initial.sql ahora que users existe)
CREATE OR REPLACE FUNCTION current_tenant() RETURNS uuid
  LANGUAGE sql STABLE SECURITY INVOKER AS $$
  SELECT COALESCE(
    current_setting('app.tenant_id', true)::uuid,
    (SELECT tenant_id FROM users WHERE id = auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION is_hub_admin() RETURNS boolean
  LANGUAGE sql STABLE SECURITY INVOKER AS $$
  SELECT EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner','admin','superadmin'));
$$;

CREATE OR REPLACE FUNCTION is_hub_owner() RETURNS boolean
  LANGUAGE sql STABLE SECURITY INVOKER AS $$
  SELECT EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner','superadmin'));
$$;

CREATE OR REPLACE FUNCTION is_superadmin() RETURNS boolean
  LANGUAGE sql STABLE SECURITY INVOKER AS $$
  SELECT EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin');
$$;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_own_tenant" ON users FOR SELECT
  USING (tenant_id = current_tenant() OR is_superadmin() OR id = auth.uid());
CREATE POLICY "users_update_own_profile" ON users FOR UPDATE
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "users_admin_manage_tenant" ON users FOR ALL
  USING ((tenant_id = current_tenant() AND is_hub_admin()) OR is_superadmin())
  WITH CHECK ((tenant_id = current_tenant() AND is_hub_admin()) OR is_superadmin());