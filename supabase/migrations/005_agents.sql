-- ============================================================================
-- HUB by Raisen — Migración 005: BC agents (agents + teams + agent_teams)
-- Depende de: 002 tenants, 003 users. Provee agents/teams para conversaciones.
-- ============================================================================

-- 1. AGENTS — unidades asignables (humano ligado a user o AI agent)
CREATE TABLE public.agents (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id        uuid REFERENCES public.users(id) ON DELETE SET NULL,
  agent_type     text NOT NULL DEFAULT 'human'
    CHECK (agent_type IN ('human','ai_agent','bot')),
  display_name   text NOT NULL,
  avatar_url     text,
  role           text NOT NULL DEFAULT 'agent'
    CHECK (role IN ('owner','admin','supervisor','agent','viewer','superadmin')),
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_agents_tenant ON agents(tenant_id, is_active);
CREATE INDEX idx_agents_user ON agents(user_id) WHERE user_id IS NOT NULL;
CREATE TRIGGER trg_agents_updated_at BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_agents" ON agents FOR ALL
  USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());

-- 2. TEAMS — grupos de agentes
CREATE TABLE public.teams (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name        text NOT NULL,
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);
CREATE TRIGGER trg_teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_teams" ON teams FOR ALL
  USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());

-- 3. AGENT_TEAMS — membresía N:M (agente en varios equipos)
CREATE TABLE public.agent_teams (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  agent_id   uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  team_id    uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, team_id)
);
ALTER TABLE public.agent_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_agent_teams" ON agent_teams FOR ALL
  USING (tenant_id = current_tenant() AND EXISTS (
    SELECT 1 FROM public.agents a WHERE a.id = agent_id AND a.tenant_id = current_tenant()
  ))
  WITH CHECK (tenant_id = current_tenant());