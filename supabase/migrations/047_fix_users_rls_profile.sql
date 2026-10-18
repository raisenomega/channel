-- 047_fix_users_rls_profile.sql  — HOTFIX N (N-1 CRITICAL). Aplicar por SQL Editor.
-- Un usuario autenticado NO puede escalar privilegios cambiando su propio tenant_id ni role.
-- La policy users_update_own_profile (003:62) permite UPDATE con id=auth.uid(), pero un
-- WITH CHECK con subconsulta a la MISMA fila lee el snapshot de forma fragil (MVCC) -> se
-- refuerza con un trigger BEFORE UPDATE que compara OLD/NEW sin ambiguedad (robusto).
-- Diseno:
--   * auth.uid() = OLD.id  -> es el propio usuario via JWT autenticado -> se bloquea el
--     cambio de tenant_id/role. Los cambios legitimos de role/tenant van por service_role
--     (OwnerClaimsLinker / flujo admin), donde auth.uid() es NULL -> el trigger NO bloquea.
--   * service_role bypasea RLS pero NO triggers; por eso el guard se ancla en auth.uid().
-- Idempotente (CREATE OR REPLACE + DROP TRIGGER IF EXISTS). Sin BEGIN/COMMIT (leccion 044).

CREATE OR REPLACE FUNCTION public.guard_users_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF auth.uid() = OLD.id THEN
    IF NEW.tenant_id IS DISTINCT FROM OLD.tenant_id THEN
      RAISE EXCEPTION 'no autorizado: no puedes cambiar tu tenant_id';
    END IF;
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'no autorizado: no puedes cambiar tu role';
    END IF;
  END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_guard_users_self_update ON public.users;
CREATE TRIGGER trg_guard_users_self_update
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_users_self_update();
