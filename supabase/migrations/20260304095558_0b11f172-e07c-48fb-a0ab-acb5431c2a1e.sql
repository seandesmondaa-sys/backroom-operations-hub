
-- Workflow pipeline stages enum
CREATE TYPE public.workflow_stage AS ENUM ('sales', 'legal', 'finance', 'operations', 'completed');
CREATE TYPE public.workflow_pipeline_status AS ENUM ('active', 'paused', 'completed', 'cancelled');
CREATE TYPE public.stage_gate_status AS ENUM ('pending', 'approved', 'rejected', 'skipped');

-- Main workflow pipeline table
CREATE TABLE public.workflow_pipelines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  current_stage workflow_stage NOT NULL DEFAULT 'sales',
  status workflow_pipeline_status NOT NULL DEFAULT 'active',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Stage gate approvals (one per stage transition)
CREATE TABLE public.workflow_stage_gates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_id UUID NOT NULL REFERENCES public.workflow_pipelines(id) ON DELETE CASCADE,
  from_stage workflow_stage NOT NULL,
  to_stage workflow_stage NOT NULL,
  status stage_gate_status NOT NULL DEFAULT 'pending',
  approver_id UUID,
  notes TEXT,
  acted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.workflow_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_stage_gates ENABLE ROW LEVEL SECURITY;

-- Pipelines RLS
CREATE POLICY "Authenticated users can view pipelines" ON public.workflow_pipelines FOR SELECT USING (true);
CREATE POLICY "Users can create pipelines" ON public.workflow_pipelines FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creator or admin can update pipelines" ON public.workflow_pipelines FOR UPDATE USING (auth.uid() = created_by OR is_super_admin(auth.uid()) OR has_role(auth.uid(), 'department_head'));
CREATE POLICY "Admins can delete pipelines" ON public.workflow_pipelines FOR DELETE USING (is_super_admin(auth.uid()));

-- Stage gates RLS
CREATE POLICY "Authenticated users can view gates" ON public.workflow_stage_gates FOR SELECT USING (true);
CREATE POLICY "System can create gates" ON public.workflow_stage_gates FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Approver or admin can update gates" ON public.workflow_stage_gates FOR UPDATE USING (auth.uid() = approver_id OR is_super_admin(auth.uid()) OR has_role(auth.uid(), 'department_head'));

-- Audit triggers
CREATE TRIGGER audit_workflow_pipelines AFTER INSERT OR UPDATE OR DELETE ON public.workflow_pipelines FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();
CREATE TRIGGER audit_workflow_stage_gates AFTER INSERT OR UPDATE OR DELETE ON public.workflow_stage_gates FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

-- Updated_at trigger
CREATE TRIGGER update_workflow_pipelines_updated_at BEFORE UPDATE ON public.workflow_pipelines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
