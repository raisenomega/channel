-- ROLLBACK 005: Eliminar tablas agents (agents, teams, agent_teams)
DROP TABLE IF EXISTS public.agent_teams CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;
DROP TABLE IF EXISTS public.agents CASCADE;