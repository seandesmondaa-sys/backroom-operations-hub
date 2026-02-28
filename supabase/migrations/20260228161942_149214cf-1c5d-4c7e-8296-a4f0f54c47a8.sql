
-- ============================================================
-- PHASE 1A: AUDIT LOGGING SYSTEM
-- ============================================================

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id text NOT NULL,
  action text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  performed_by uuid,
  performed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can view audit logs"
ON public.audit_logs FOR SELECT TO authenticated
USING (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'department_head'));

CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT TO authenticated
WITH CHECK (true);

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, new_data, performed_by)
    VALUES (TG_TABLE_NAME, NEW.id::text, 'INSERT', to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data, performed_by)
    VALUES (TG_TABLE_NAME, NEW.id::text, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, old_data, performed_by)
    VALUES (TG_TABLE_NAME, OLD.id::text, 'DELETE', to_jsonb(OLD), auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Attach audit triggers to all key tables
CREATE TRIGGER audit_expenses AFTER INSERT OR UPDATE OR DELETE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
CREATE TRIGGER audit_budgets AFTER INSERT OR UPDATE OR DELETE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
CREATE TRIGGER audit_invoices AFTER INSERT OR UPDATE OR DELETE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
CREATE TRIGGER audit_hr_leave AFTER INSERT OR UPDATE OR DELETE ON public.hr_leave_requests FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
CREATE TRIGGER audit_os_tasks AFTER INSERT OR UPDATE OR DELETE ON public.os_tasks FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
CREATE TRIGGER audit_user_roles AFTER INSERT OR UPDATE OR DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- ============================================================
-- PHASE 1B: DOCUMENT MANAGEMENT SYSTEM
-- ============================================================

CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  mime_type text,
  version integer NOT NULL DEFAULT 1,
  parent_document_id uuid REFERENCES public.documents(id),
  project_id text,
  department_id uuid REFERENCES public.departments(id),
  tags text[] DEFAULT '{}',
  description text,
  uploaded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view documents"
ON public.documents FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can upload documents"
ON public.documents FOR INSERT TO authenticated
WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Uploader or admin can update documents"
ON public.documents FOR UPDATE TO authenticated
USING (auth.uid() = uploaded_by OR public.is_super_admin(auth.uid()));

CREATE POLICY "Uploader or admin can delete documents"
ON public.documents FOR DELETE TO authenticated
USING (auth.uid() = uploaded_by OR public.is_super_admin(auth.uid()));

CREATE TRIGGER audit_documents AFTER INSERT OR UPDATE OR DELETE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

CREATE POLICY "Auth users can upload to documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Auth users can read documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "Auth users can update documents"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "Uploader can delete documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documents');

-- ============================================================
-- PHASE 1C: APPROVAL HIERARCHY ENGINE
-- ============================================================

CREATE TYPE public.approval_type AS ENUM ('expense', 'leave', 'budget', 'contract', 'document');
CREATE TYPE public.approval_request_status AS ENUM ('pending', 'in_progress', 'approved', 'rejected', 'cancelled');
CREATE TYPE public.approval_step_status AS ENUM ('pending', 'approved', 'rejected', 'skipped');

CREATE TABLE public.approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_type public.approval_type NOT NULL,
  reference_id text NOT NULL,
  title text NOT NULL,
  description text,
  status public.approval_request_status NOT NULL DEFAULT 'pending',
  requested_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view approval requests"
ON public.approval_requests FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can create approval requests"
ON public.approval_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Managers can update approval requests"
ON public.approval_requests FOR UPDATE TO authenticated
USING (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'department_head') OR auth.uid() = requested_by);

CREATE TABLE public.approval_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.approval_requests(id) ON DELETE CASCADE,
  step_order integer NOT NULL DEFAULT 1,
  approver_id uuid NOT NULL,
  status public.approval_step_status NOT NULL DEFAULT 'pending',
  notes text,
  acted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.approval_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view approval steps"
ON public.approval_steps FOR SELECT TO authenticated
USING (true);

CREATE POLICY "System can create approval steps"
ON public.approval_steps FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Approver can act on their step"
ON public.approval_steps FOR UPDATE TO authenticated
USING (auth.uid() = approver_id OR public.is_super_admin(auth.uid()));

CREATE TRIGGER audit_approval_requests AFTER INSERT OR UPDATE OR DELETE ON public.approval_requests FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
CREATE TRIGGER audit_approval_steps AFTER INSERT OR UPDATE OR DELETE ON public.approval_steps FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Enable realtime for approval tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.approval_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
