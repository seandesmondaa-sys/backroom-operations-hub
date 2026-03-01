
-- =============================================
-- PHASE 2: Business Development, Legal & Compliance, Marketing
-- =============================================

-- 1. ENUMS
CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'lost');
CREATE TYPE public.deal_type AS ENUM ('equity', 'debt', 'mezzanine', 'grant', 'advisory', 'other');
CREATE TYPE public.readiness_stage AS ENUM ('concept', 'early_development', 'structuring', 'investment_ready', 'capital_deployment');
CREATE TYPE public.contract_status AS ENUM ('draft', 'review', 'pending_approval', 'active', 'expired', 'terminated');
CREATE TYPE public.contract_type AS ENUM ('nda', 'service_agreement', 'investment_agreement', 'mou', 'consulting', 'employment', 'other');
CREATE TYPE public.campaign_status AS ENUM ('planned', 'active', 'paused', 'completed', 'cancelled');

-- 2. LEADS TABLE (Business Development)
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company text,
  email text,
  phone text,
  source text,
  deal_type deal_type DEFAULT 'advisory',
  status lead_status NOT NULL DEFAULT 'new',
  funding_target numeric DEFAULT 0,
  lead_score integer DEFAULT 0,
  readiness_stage readiness_stage DEFAULT 'concept',
  notes text,
  assigned_to uuid,
  converted_project_id text,
  created_by uuid NOT NULL,
  department_id uuid REFERENCES public.departments(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view leads" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creator or assignee can update leads" ON public.leads FOR UPDATE TO authenticated USING (auth.uid() = created_by OR auth.uid() = assigned_to OR is_super_admin(auth.uid()));
CREATE POLICY "Admins can delete leads" ON public.leads FOR DELETE TO authenticated USING (is_super_admin(auth.uid()) OR auth.uid() = created_by);

-- Audit trigger for leads
CREATE TRIGGER audit_leads AFTER INSERT OR UPDATE OR DELETE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. CONTRACTS TABLE (Legal & Compliance)
CREATE TABLE public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  contract_type contract_type NOT NULL DEFAULT 'other',
  status contract_status NOT NULL DEFAULT 'draft',
  counterparty text,
  start_date date,
  end_date date,
  value numeric,
  description text,
  template_content text,
  project_id text,
  department_id uuid REFERENCES public.departments(id),
  created_by uuid NOT NULL,
  approved_by uuid,
  approved_at timestamptz,
  version integer NOT NULL DEFAULT 1,
  parent_contract_id uuid REFERENCES public.contracts(id),
  tags text[] DEFAULT '{}',
  file_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view contracts" ON public.contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create contracts" ON public.contracts FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creator or admin can update contracts" ON public.contracts FOR UPDATE TO authenticated USING (auth.uid() = created_by OR is_super_admin(auth.uid()) OR has_role(auth.uid(), 'department_head'));
CREATE POLICY "Admins can delete contracts" ON public.contracts FOR DELETE TO authenticated USING (is_super_admin(auth.uid()));

CREATE TRIGGER audit_contracts AFTER INSERT OR UPDATE OR DELETE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. COMPLIANCE CHECKLIST TABLE
CREATE TABLE public.compliance_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  is_completed boolean NOT NULL DEFAULT false,
  completed_by uuid,
  completed_at timestamptz,
  contract_id uuid REFERENCES public.contracts(id) ON DELETE CASCADE,
  project_id text,
  due_date date,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.compliance_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view compliance" ON public.compliance_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create compliance items" ON public.compliance_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update compliance items" ON public.compliance_items FOR UPDATE TO authenticated USING (auth.uid() = created_by OR is_super_admin(auth.uid()) OR has_role(auth.uid(), 'department_head'));
CREATE POLICY "Admins can delete compliance items" ON public.compliance_items FOR DELETE TO authenticated USING (is_super_admin(auth.uid()));

CREATE TRIGGER update_compliance_updated_at BEFORE UPDATE ON public.compliance_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. CAMPAIGNS TABLE (Marketing)
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  status campaign_status NOT NULL DEFAULT 'planned',
  campaign_type text DEFAULT 'general',
  start_date date,
  end_date date,
  budget numeric DEFAULT 0,
  spent numeric DEFAULT 0,
  description text,
  target_audience text,
  channels text[] DEFAULT '{}',
  created_by uuid NOT NULL,
  department_id uuid REFERENCES public.departments(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view campaigns" ON public.campaigns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create campaigns" ON public.campaigns FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creator or admin can update campaigns" ON public.campaigns FOR UPDATE TO authenticated USING (auth.uid() = created_by OR is_super_admin(auth.uid()) OR has_role(auth.uid(), 'department_head'));
CREATE POLICY "Admins can delete campaigns" ON public.campaigns FOR DELETE TO authenticated USING (is_super_admin(auth.uid()));

CREATE TRIGGER audit_campaigns AFTER INSERT OR UPDATE OR DELETE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. MEDIA ASSETS TABLE (Marketing)
CREATE TABLE public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  asset_type text NOT NULL DEFAULT 'image',
  file_path text NOT NULL,
  file_size bigint,
  mime_type text,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  tags text[] DEFAULT '{}',
  description text,
  uploaded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view assets" ON public.media_assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can upload assets" ON public.media_assets FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "Uploader or admin can update assets" ON public.media_assets FOR UPDATE TO authenticated USING (auth.uid() = uploaded_by OR is_super_admin(auth.uid()));
CREATE POLICY "Uploader or admin can delete assets" ON public.media_assets FOR DELETE TO authenticated USING (auth.uid() = uploaded_by OR is_super_admin(auth.uid()));

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.media_assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. MEDIA STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public) VALUES ('media-assets', 'media-assets', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media-assets');
CREATE POLICY "Authenticated users can view media" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'media-assets');
CREATE POLICY "Owner can delete media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media-assets');
