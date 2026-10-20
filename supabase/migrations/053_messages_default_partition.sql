-- 053_messages_default_partition.sql
-- Hotfix P (Compuerta #170): CAUSA RAIZ del silent failure del ingest de mensajes.
-- La tabla public.messages se creo en 011 como `PARTITION BY RANGE (created_at)` pero NUNCA se creo
-- ninguna particion -> TODO INSERT fallaba con "no partition of relation \"messages\" found for row".
-- Por eso conversations/contacts (no particionadas) persistian pero messages quedaba en 0.
-- Fix: particion DEFAULT que captura cualquier fila sin importar created_at (robusto para el piloto).
-- La RLS del padre y el service-role del backend aplican igual via la tabla padre.
CREATE TABLE IF NOT EXISTS public.messages_default PARTITION OF public.messages DEFAULT;
