-- =========================================================================
-- HUB by Raisen — Migración Inicial
-- FASE 1: BC identity + extensiones + helpers globales + enums
-- =========================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_partman SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS vector SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS http SCHEMA extensions;

-- 2. HELPERS GLOBALES
-- OJO: estas 4 funciones dependen de la tabla users, que aún no existe en esta
-- migración (se crea en 003_users.sql). Por eso aquí solo se define una versión
-- independiente de users; la versión completa (con fallback a users) se
-- reemplaza con CREATE OR REPLACE dentro de 003_users.sql.
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

CREATE OR REPLACE FUNCTION _set_updated_at() RETURNS trigger
  LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION sanitize_phone(raw text) RETURNS text
  LANGUAGE sql IMMUTABLE AS $$
  SELECT regexp_replace(raw, '[^\d+]', '', 'g');
$$;

CREATE OR REPLACE FUNCTION sanitize_email(raw text) RETURNS text
  LANGUAGE sql IMMUTABLE AS $$
  SELECT lower(trim(raw));
$$;