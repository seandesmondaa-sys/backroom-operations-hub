
-- Fix overly permissive INSERT/UPDATE policies on project_readiness
DROP POLICY "Authenticated users can insert readiness" ON public.project_readiness;
DROP POLICY "Authenticated users can update readiness" ON public.project_readiness;

CREATE POLICY "Managers can insert readiness" ON public.project_readiness FOR INSERT
  WITH CHECK (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'department_head'::app_role));

CREATE POLICY "Managers can update readiness" ON public.project_readiness FOR UPDATE
  USING (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'department_head'::app_role));
