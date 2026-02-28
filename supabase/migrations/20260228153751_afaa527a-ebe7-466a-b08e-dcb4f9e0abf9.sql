
-- Leave status enum
CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE public.leave_type AS ENUM ('annual', 'sick', 'personal', 'maternity', 'paternity', 'unpaid', 'other');

-- Leave requests
CREATE TABLE public.hr_leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  leave_type leave_type NOT NULL DEFAULT 'annual',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count NUMERIC(4,1) NOT NULL DEFAULT 1,
  reason TEXT,
  status leave_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_leave_requests ENABLE ROW LEVEL SECURITY;

-- Performance logs
CREATE TABLE public.hr_performance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  logged_by UUID NOT NULL,
  period TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  strengths TEXT,
  improvements TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_performance_logs ENABLE ROW LEVEL SECURITY;

-- Confidential HR notes
CREATE TABLE public.hr_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_confidential BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_notes ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_hr_leave_user ON public.hr_leave_requests(user_id);
CREATE INDEX idx_hr_leave_status ON public.hr_leave_requests(status);
CREATE INDEX idx_hr_perf_user ON public.hr_performance_logs(user_id);
CREATE INDEX idx_hr_notes_user ON public.hr_notes(user_id);

-- RLS: Leave requests
-- Users can view own leaves, department heads & super admins can view all
CREATE POLICY "Users can view own leave requests"
  ON public.hr_leave_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'department_head'));

CREATE POLICY "Users can create own leave requests"
  ON public.hr_leave_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending leaves"
  ON public.hr_leave_requests FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status = 'pending');

-- Dept heads and super admins can review (update) any leave
CREATE POLICY "Managers can review leave requests"
  ON public.hr_leave_requests FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'department_head'));

-- RLS: Performance logs
-- Only dept heads and super admins can view/create
CREATE POLICY "Managers can view performance logs"
  ON public.hr_performance_logs FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'department_head') OR auth.uid() = user_id);

CREATE POLICY "Managers can create performance logs"
  ON public.hr_performance_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'department_head'));

CREATE POLICY "Log author can update"
  ON public.hr_performance_logs FOR UPDATE TO authenticated
  USING (auth.uid() = logged_by);

-- RLS: HR Notes (confidential - only super admins and dept heads)
CREATE POLICY "Managers can view HR notes"
  ON public.hr_notes FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'department_head'));

CREATE POLICY "Managers can create HR notes"
  ON public.hr_notes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'department_head')));

CREATE POLICY "Author can update HR notes"
  ON public.hr_notes FOR UPDATE TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Author can delete HR notes"
  ON public.hr_notes FOR DELETE TO authenticated
  USING (auth.uid() = author_id);

-- Triggers
CREATE TRIGGER update_hr_leave_updated_at
  BEFORE UPDATE ON public.hr_leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hr_perf_updated_at
  BEFORE UPDATE ON public.hr_performance_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hr_notes_updated_at
  BEFORE UPDATE ON public.hr_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
