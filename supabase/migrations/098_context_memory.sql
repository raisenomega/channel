-- HUB by Raisen — 098: context_memory. El agente lee el contexto COMPLETO una vez y lo guarda en memoria;
-- reusa sin releer la fuente en cada mensaje. Se refresca a los 15 dias o al invalidar (guardar contexto).
CREATE TABLE IF NOT EXISTS public.context_memory (
  tenant_id uuid PRIMARY KEY,
  brand_voice text NOT NULL DEFAULT '',
  catalog_context text NOT NULL DEFAULT '',
  refreshed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.context_memory ENABLE ROW LEVEL SECURITY;
