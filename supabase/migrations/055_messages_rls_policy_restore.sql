-- 055_messages_rls_policy_restore.sql
-- Hotfix P Bloque 5 (Issue #3): los mensajes del inbox NO se renderizaban ("Sin mensajes aun")
-- aunque existian en la DB y el fetch respondia 200.
--
-- CAUSA RAIZ (confirmada en prod con pg_class + pg_policies):
--   - pg_class: public.messages y public.messages_default tienen relrowsecurity = true (RLS ON).
--   - pg_policies: 0 filas para 'messages' y 'messages_default' -> NO existe ninguna politica.
--   - RLS habilitada + 0 politicas = Postgres NIEGA todas las filas al rol `authenticated`.
-- Por eso el frontend (JWT, RLS aplica) recibia 200 [] mientras el SQL editor (service_role,
-- bypasea RLS) si contaba las filas. conversations SI funcionaba porque conserva su politica
-- tenant_isolation_conversations. La politica de 011 (tenant_isolation_messages) no quedo en prod
-- (drift: la tabla particionada se recreo sin re-aplicarla).
--
-- FIX: (re)crear la politica de aislamiento por tenant en el padre `messages` Y en la particion
-- `messages_default`. Mantiene el aislamiento multi-tenant (misma regla que el resto del esquema);
-- NO desactiva RLS. Idempotente (DROP IF EXISTS antes de CREATE), seguro de re-aplicar.

DROP POLICY IF EXISTS "tenant_isolation_messages" ON public.messages;
CREATE POLICY "tenant_isolation_messages" ON public.messages
  FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());

-- La particion tiene RLS propia habilitada; si Postgres evalua su RLS en accesos via el padre,
-- sin esta politica seguiria negando. La replicamos (belt-and-suspenders, misma regla por tenant).
DROP POLICY IF EXISTS "tenant_isolation_messages_default" ON public.messages_default;
CREATE POLICY "tenant_isolation_messages_default" ON public.messages_default
  FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());
