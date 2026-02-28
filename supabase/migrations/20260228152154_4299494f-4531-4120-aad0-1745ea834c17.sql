
-- Task status and priority enums
CREATE TYPE public.task_status AS ENUM ('backlog', 'todo', 'in_progress', 'waiting', 'done');
CREATE TYPE public.task_priority AS ENUM ('urgent', 'high', 'medium', 'low');
CREATE TYPE public.recurrence_type AS ENUM ('none', 'daily', 'weekly', 'biweekly', 'monthly');

-- Main tasks table
CREATE TABLE public.os_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES public.os_tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'todo',
  priority task_priority NOT NULL DEFAULT 'medium',
  assignee_id UUID,
  created_by UUID NOT NULL,
  project_id TEXT,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  recurrence recurrence_type NOT NULL DEFAULT 'none',
  recurrence_next TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.os_tasks ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_os_tasks_assignee ON public.os_tasks(assignee_id);
CREATE INDEX idx_os_tasks_status ON public.os_tasks(status);
CREATE INDEX idx_os_tasks_parent ON public.os_tasks(parent_id);
CREATE INDEX idx_os_tasks_due_date ON public.os_tasks(due_date);

-- RLS policies
CREATE POLICY "Authenticated users can view all tasks"
  ON public.os_tasks FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create tasks"
  ON public.os_tasks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Task creator or assignee can update"
  ON public.os_tasks FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR auth.uid() = assignee_id);

CREATE POLICY "Task creator can delete"
  ON public.os_tasks FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

-- Super admins can also manage all tasks
CREATE POLICY "Super admins can update any task"
  ON public.os_tasks FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete any task"
  ON public.os_tasks FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- Updated_at trigger
CREATE TRIGGER update_os_tasks_updated_at
  BEFORE UPDATE ON public.os_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.os_tasks;
