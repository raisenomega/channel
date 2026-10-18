-- 051_users_email_sync_trigger.sql
-- R-8 (Compuerta #83): sincroniza public.users.email con auth.users.email (fuente de verdad).
-- Approach C: trigger BEFORE INSERT OR UPDATE OF email en el schema PUBLICO + funcion
-- SECURITY DEFINER que LEE (solo SELECT) del schema protegido auth. Evita necesidad de
-- permisos directos a auth, mantiene atomicidad y funciona universalmente.
-- Fixea el bug a1c53826 (auth: raisendevelopment@ vs public: johannylopezpr@).
-- Owner aplica por SQL Editor pre-merge. Coexiste con guard_users_self_update (047, otro trigger).

BEGIN;

CREATE OR REPLACE FUNCTION public.sync_user_email_from_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  auth_email text;
BEGIN
  SELECT email INTO auth_email FROM auth.users WHERE id = NEW.id;
  IF auth_email IS NULL THEN
    RAISE EXCEPTION 'user % does not exist in auth.users', NEW.id;
  END IF;
  -- auth es la fuente de verdad: siempre sobrescribe el email entrante si difiere.
  IF NEW.email IS DISTINCT FROM auth_email THEN
    NEW.email := auth_email;
  END IF;
  RETURN NEW;
END;
$$;

-- Hardening: la funcion DEFINER no debe ser invocable por PUBLIC.
REVOKE ALL ON FUNCTION public.sync_user_email_from_auth() FROM PUBLIC;

DROP TRIGGER IF EXISTS sync_user_email_before_insert_update ON public.users;
CREATE TRIGGER sync_user_email_before_insert_update
BEFORE INSERT OR UPDATE OF email ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_email_from_auth();

-- Backfill one-time de los users existentes desincronizados (incluye a1c53826).
UPDATE public.users u
SET email = a.email
FROM auth.users a
WHERE u.id = a.id AND u.email IS DISTINCT FROM a.email;

COMMIT;
