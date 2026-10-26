-- HUB by Raisen — 099: indice para el lookup PUBLICO de la cotizacion por token (agent_drafts.metadata->>'token').
-- Evita seq-scan en /q/:token a escala. Parcial: solo indexa las filas con token (las propuestas de cotizacion).
CREATE INDEX IF NOT EXISTS agent_drafts_quote_token_idx
  ON public.agent_drafts ((metadata->>'token'))
  WHERE metadata->>'token' IS NOT NULL;
