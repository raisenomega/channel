-- ROLLBACK 003: Eliminar tabla users y restaurar helpers a sus stubs (001)
DROP TABLE IF EXISTS public.users CASCADE;

-- Restaurar las stubs de 001_initial.sql (dependen de users, que se acaba de borrar)
CREATE OR REPLACE FUNCTION current_tenant() RETURNS uuid
  LANGUAGE sql STABLE SECURITY INVOKER AS $$
  SELECT current_setting('app.tenant_id', true)::uuid;
$$;

CREATE OR REPLACE FUNCTION is_hub_admin() RETURNS boolean
  LANGUAGE sql STABLE SECURITY INVOKER AS $$
  SELECT false;
$$;

CREATE OR REPLACE FUNCTION is_hub_owner() RETURNS boolean
  LANGUAGE sql STABLE SECURITY INVOKER AS $$
  SELECT false;
$$;

CREATE OR REPLACE FUNCTION is_superadmin() RETURNS boolean
  LANGUAGE sql STABLE SECURITY INVOKER AS $$
  SELECT false;
$$;