
-- Budget categories enum
CREATE TYPE public.budget_category AS ENUM ('operational', 'marketing', 'staffing', 'legal', 'technology', 'travel', 'other');

-- Expense status enum
CREATE TYPE public.expense_status AS ENUM ('pending', 'approved', 'rejected', 'paid');

-- Invoice status enum
CREATE TYPE public.invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');

-- Budgets table
CREATE TABLE public.budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category budget_category NOT NULL DEFAULT 'operational',
  department_id UUID REFERENCES public.departments(id),
  project_id TEXT,
  allocated_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  spent_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  fiscal_year TEXT NOT NULL DEFAULT '2026',
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view budgets" ON public.budgets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins and dept heads can create budgets" ON public.budgets FOR INSERT TO authenticated WITH CHECK (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'department_head'));
CREATE POLICY "Budget creator can update" ON public.budgets FOR UPDATE TO authenticated USING (auth.uid() = created_by OR is_super_admin(auth.uid()));
CREATE POLICY "Super admins can delete budgets" ON public.budgets FOR DELETE TO authenticated USING (is_super_admin(auth.uid()));

-- Expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id UUID REFERENCES public.budgets(id),
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  category budget_category NOT NULL DEFAULT 'operational',
  vendor TEXT,
  receipt_url TEXT,
  status expense_status NOT NULL DEFAULT 'pending',
  submitted_by UUID NOT NULL,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all expenses" ON public.expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can submit expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (auth.uid() = submitted_by);
CREATE POLICY "Submitter can update pending expenses" ON public.expenses FOR UPDATE TO authenticated USING (auth.uid() = submitted_by AND status = 'pending');
CREATE POLICY "Managers can approve expenses" ON public.expenses FOR UPDATE TO authenticated USING (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'department_head'));
CREATE POLICY "Super admins can delete expenses" ON public.expenses FOR DELETE TO authenticated USING (is_super_admin(auth.uid()));

-- Revenue entries table
CREATE TABLE public.revenue_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  project_id TEXT,
  description TEXT,
  revenue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  recorded_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.revenue_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view revenue" ON public.revenue_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can record revenue" ON public.revenue_entries FOR INSERT TO authenticated WITH CHECK (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'department_head'));
CREATE POLICY "Recorder can update revenue" ON public.revenue_entries FOR UPDATE TO authenticated USING (auth.uid() = recorded_by OR is_super_admin(auth.uid()));
CREATE POLICY "Super admins can delete revenue" ON public.revenue_entries FOR DELETE TO authenticated USING (is_super_admin(auth.uid()));

-- Invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  status invoice_status NOT NULL DEFAULT 'draft',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  paid_date DATE,
  project_id TEXT,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view invoices" ON public.invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can create invoices" ON public.invoices FOR INSERT TO authenticated WITH CHECK (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'department_head'));
CREATE POLICY "Creator can update invoices" ON public.invoices FOR UPDATE TO authenticated USING (auth.uid() = created_by OR is_super_admin(auth.uid()));
CREATE POLICY "Super admins can delete invoices" ON public.invoices FOR DELETE TO authenticated USING (is_super_admin(auth.uid()));

-- Enable realtime for finance tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
