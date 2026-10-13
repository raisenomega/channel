-- FASE 3 — BC messages (particionada mensual via pg_partman)

CREATE TABLE public.messages (
  id                uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  conversation_id   uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  contact_id        uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  inbox_id          uuid REFERENCES public.inboxes(id),
  direction         text NOT NULL CHECK (direction IN ('inbound','outbound','internal')),
  sender_type       text NOT NULL CHECK (sender_type IN ('contact','human_agent','ai_agent','system')),
  sender_user_id    uuid REFERENCES public.users(id),
  channel           text NOT NULL,
  provider          text NOT NULL,
  provider_message_id text,
  content_type      text NOT NULL DEFAULT 'text'
    CHECK (content_type IN ('text','template','image','video','audio','document','location','contact_card','sticker','reaction','system_event')),
  content           text,
  template_name     text,
  template_params   jsonb,
  has_attachments   boolean NOT NULL DEFAULT false,
  -- reply_to_message_id sin FK: messages es particionada por created_at con
  -- PK (created_at, id); una FK self-referencial a id solo no es posible en
  -- una tabla particionada. La relacion de reply se valida en la app.
  reply_to_message_id uuid,
  status            text NOT NULL DEFAULT 'sent'
    CHECK (status IN ('draft','sending','sent','delivered','read','failed','received')),
  error_code        text,
  retry_count       int DEFAULT 0,
  ai_agent_interaction_id uuid,
  ai_confidence     numeric CHECK (ai_confidence BETWEEN 0 AND 1),
  ai_mode           text CHECK (ai_mode IN ('assistant','copilot','autonomous')),
  ai_was_edited_by_human boolean,
  intentional_delay_ms int,
  simulated_typing_duration_ms int,
  created_at        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (created_at, id)
) PARTITION BY RANGE (created_at);

CREATE INDEX idx_messages_conv ON messages(tenant_id, conversation_id, created_at DESC);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_messages" ON messages FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());

-- Tablas auxiliares
CREATE TABLE public.conversation_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  applied_by_type text CHECK (applied_by_type IN ('human','ai_agent','system','automation')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, tag_id)
);
ALTER TABLE public.conversation_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_conv_tags" ON conversation_tags FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());

CREATE TABLE public.conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  participant_role text NOT NULL CHECK (participant_role IN ('primary_contact','observer','collaborator','assigned_agent','supervisor')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  CHECK ((contact_id IS NOT NULL AND user_id IS NULL) OR (contact_id IS NULL AND user_id IS NOT NULL))
);
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_conv_participants" ON conversation_participants FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());