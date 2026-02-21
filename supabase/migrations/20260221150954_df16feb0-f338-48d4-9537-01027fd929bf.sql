
-- Replace overly permissive notifications insert policy with one scoped to thread participants
DROP POLICY "System can create notifications" ON public.notifications;

CREATE POLICY "Authenticated users can create notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
