-- FASE 11 — SAFE governance + autonomia progresiva

CREATE TABLE public.safe_evaluations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  interaction_id    uuid REFERENCES public.agent_interactions(id),
  eval_type         text NOT NULL CHECK (eval_type IN ('pre_send','post_send','scheduled')),
  status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','blocked','abstained')),
  ensemble_results  jsonb NOT NULL DEFAULT '{}',
  disagreement_pct  numeric CHECK (disagreement_pct BETWEEN 0 AND 100),
  final_decision    text CHECK (final_decision IN ('approved','blocked','abstained')),
  metrics           jsonb DEFAULT '{}',
  evaluated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_safe_tenant ON safe_evaluations(tenant_id, eval_type, evaluated_at DESC);
ALTER TABLE public.safe_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_safe" ON safe_evaluations FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());

CREATE TABLE public.autonomy_progression (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  current_phase     int NOT NULL DEFAULT 0 CHECK (current_phase BETWEEN 0 AND 4),
  phase_0_activated_at timestamptz,
  phase_1_activated_at timestamptz,
  phase_2_activated_at timestamptz,
  phase_3_activated_at timestamptz,
  phase_4_activated_at timestamptz,
  was_correct_threshold numeric NOT NULL DEFAULT 0.85,
  indistinguishability_threshold numeric NOT NULL DEFAULT 0.80,
  csat_threshold    numeric NOT NULL DEFAULT 4.0,
  is_kill_switched  boolean NOT NULL DEFAULT false,
  kill_switched_at  timestamptz,
  kill_switch_reason text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_autonomy_progression_tenant ON autonomy_progression(tenant_id);
ALTER TABLE public.autonomy_progression ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_autonomy_progression" ON autonomy_progression FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());

CREATE TABLE public.safe_weekly_reports (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  week_start        date NOT NULL,
  week_end          date NOT NULL,
  total_interactions int NOT NULL DEFAULT 0,
  autonomous_interactions int NOT NULL DEFAULT 0,
  escalated_count   int NOT NULL DEFAULT 0,
  was_correct_rate  numeric,
  indistinguishability_avg numeric,
  avg_confidence    numeric,
  total_cost_usd    numeric,
  incidents         jsonb DEFAULT '[]',
  recommendations   text[] DEFAULT '{}',
  created_at        timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.safe_weekly_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_weekly_reports" ON safe_weekly_reports FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());