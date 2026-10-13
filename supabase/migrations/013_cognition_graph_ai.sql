-- FASE 7 — Graph memory + autonomy config + AI provider configs

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE public.agent_graph_memory (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  node_type       text NOT NULL CHECK (node_type IN ('contact','conversation','message','product','service','order','quote','employee','vertical_entity','concept','preference','pattern')),
  node_key        text NOT NULL,
  node_data       jsonb NOT NULL DEFAULT '{}',
  embedding       vector(1536),
  weight          numeric DEFAULT 1.0,
  last_accessed_at timestamptz, access_count int DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, node_key)
);
CREATE INDEX idx_graph_nodes_tenant ON agent_graph_memory(tenant_id);
CREATE INDEX idx_graph_nodes_embedding ON agent_graph_memory USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
ALTER TABLE public.agent_graph_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_graph" ON agent_graph_memory FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());

CREATE TABLE public.agent_graph_edges (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  from_node_id    uuid NOT NULL REFERENCES public.agent_graph_memory(id),
  to_node_id      uuid NOT NULL REFERENCES public.agent_graph_memory(id),
  edge_type       text NOT NULL CHECK (edge_type IN ('purchased','asked_about','complained_about','recommended','prefers','avoids','similar_to','related_to','caused','resulted_in','escalated_from','resolved_by','follows','precedes')),
  weight          numeric DEFAULT 1.0, metadata jsonb DEFAULT '{}',
  reinforced_count int DEFAULT 1,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_graph_edges_from ON agent_graph_edges(tenant_id, from_node_id);
ALTER TABLE public.agent_graph_edges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_graph_edges" ON agent_graph_edges FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());

CREATE TABLE public.agent_autonomy_config (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  channel                 text,
  schedule_start          time, schedule_end time,
  allowed_actions         text[] NOT NULL DEFAULT '{}',
  requires_human_approval text[] NOT NULL DEFAULT '{}',
  is_active               boolean NOT NULL DEFAULT true,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.agent_autonomy_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_autonomy" ON agent_autonomy_config FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());

CREATE TABLE public.ai_provider_configs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider          text NOT NULL CHECK (provider IN ('anthropic','deepseek','qwen','openai')),
  model             text NOT NULL DEFAULT 'claude-sonnet-4-6',
  secrets_encrypted jsonb NOT NULL DEFAULT '{}',
  max_tokens        int NOT NULL DEFAULT 4096,
  temperature       real NOT NULL DEFAULT 0.7,
  fallback_provider text,
  is_active         boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_ai_provider_tenant ON ai_provider_configs(tenant_id, provider);
ALTER TABLE public.ai_provider_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_ai_providers" ON ai_provider_configs FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());