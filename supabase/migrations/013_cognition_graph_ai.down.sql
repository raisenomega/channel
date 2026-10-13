-- ROLLBACK 013: Eliminar tablas cognition graph + ai providers
DROP TABLE IF EXISTS public.ai_provider_configs CASCADE;
DROP TABLE IF EXISTS public.agent_autonomy_config CASCADE;
DROP TABLE IF EXISTS public.agent_graph_edges CASCADE;
DROP TABLE IF EXISTS public.agent_graph_memory CASCADE;