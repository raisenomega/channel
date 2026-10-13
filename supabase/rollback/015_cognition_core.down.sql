-- ROLLBACK 015: Eliminar tablas cognition core
DROP TABLE IF EXISTS public.agent_episodes CASCADE;
DROP TABLE IF EXISTS public.agent_knowledge CASCADE;
DROP TABLE IF EXISTS public.agent_interactions CASCADE;