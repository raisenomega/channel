-- HUB by Raisen — Hotfix P bloque 7 (#1): entrega real por el inbox de Zernio.
-- El envío real es POST /v1/inbox/conversations/{conversationId}/messages { accountId, message }.
-- Guardamos ambos datos (ambos llegan en cada webhook inbound): el id de conversación del PROVEEDOR
-- (conversation.id) y la cuenta emisora (account.id = zernio_account_id).
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS provider_conversation_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_account_id TEXT;

-- Backfill del accountId: lo conocemos por (tenant, canal) desde channel_connections.
-- (El provider_conversation_id NO se puede backfillear: no guardábamos el id de Zernio; los hilos
--  viejos lo capturan cuando llega un inbound nuevo. Los nuevos entregan de una.)
UPDATE public.conversations c
SET provider_account_id = cc.zernio_account_id
FROM public.channel_connections cc
WHERE cc.tenant_id = c.tenant_id
  AND cc.platform = c.primary_channel::text
  AND cc.zernio_account_id IS NOT NULL
  AND c.provider_account_id IS NULL;
