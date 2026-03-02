
-- ─── HR Attendance Tracking ────────────────────────────────
CREATE TABLE public.hr_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  clock_in timestamp with time zone NOT NULL DEFAULT now(),
  clock_out timestamp with time zone,
  total_hours numeric GENERATED ALWAYS AS (
    CASE WHEN clock_out IS NOT NULL THEN ROUND(EXTRACT(EPOCH FROM (clock_out - clock_in)) / 3600.0, 2) ELSE NULL END
  ) STORED,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attendance" ON public.hr_attendance FOR SELECT
  USING (auth.uid() = user_id OR is_super_admin(auth.uid()) OR has_role(auth.uid(), 'department_head'::app_role));

CREATE POLICY "Users can clock in" ON public.hr_attendance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can clock out" ON public.hr_attendance FOR UPDATE
  USING (auth.uid() = user_id);

-- Audit trigger
CREATE TRIGGER audit_hr_attendance AFTER INSERT OR UPDATE OR DELETE ON public.hr_attendance
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- ─── Investment Readiness Criteria Tracking ────────────────
CREATE TABLE public.project_readiness (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL,
  has_financial_model boolean NOT NULL DEFAULT false,
  has_legal_docs boolean NOT NULL DEFAULT false,
  has_feasibility_study boolean NOT NULL DEFAULT false,
  has_regulatory_approvals boolean NOT NULL DEFAULT false,
  has_revenue_projections boolean NOT NULL DEFAULT false,
  readiness_stage text NOT NULL DEFAULT 'concept',
  auto_score integer NOT NULL DEFAULT 0,
  manual_override_stage text,
  notes text,
  updated_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(project_id)
);

ALTER TABLE public.project_readiness ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view readiness" ON public.project_readiness FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert readiness" ON public.project_readiness FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update readiness" ON public.project_readiness FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE TRIGGER audit_project_readiness AFTER INSERT OR UPDATE OR DELETE ON public.project_readiness
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER update_project_readiness_updated_at BEFORE UPDATE ON public.project_readiness
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
