-- 102 — Acelera la dedup de mensajes (idempotencia). La tabla messages esta PARTICIONADA por created_at,
-- asi que un UNIQUE tendria que incluir created_at y seria inutil (una reentrega trae otro created_at).
-- La unicidad logica la garantiza la APP: ingest llama mensajeYaExiste(tenant, provider_message_id) ANTES
-- de insertar, y el repo ahora SI escribe provider_message_id (antes NULL -> dedup no-op -> loop de eco).
-- Este indice (NO unico) solo hace esa consulta de dedup barata en cada inbound.
CREATE INDEX IF NOT EXISTS messages_tenant_pmid_idx
  ON public.messages (tenant_id, provider_message_id);
