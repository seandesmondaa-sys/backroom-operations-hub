
-- Event type enum
CREATE TYPE public.event_type AS ENUM ('meeting', 'follow_up', 'deadline', 'reminder', 'other');

-- Main events table
CREATE TABLE public.os_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type event_type NOT NULL DEFAULT 'meeting',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN NOT NULL DEFAULT false,
  location TEXT,
  created_by UUID NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  project_id TEXT,
  is_global BOOLEAN NOT NULL DEFAULT false,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.os_events ENABLE ROW LEVEL SECURITY;

-- Event attendees
CREATE TABLE public.os_event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.os_events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

ALTER TABLE public.os_event_attendees ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_os_events_start ON public.os_events(start_time);
CREATE INDEX idx_os_events_dept ON public.os_events(department_id);
CREATE INDEX idx_os_event_attendees_user ON public.os_event_attendees(user_id);

-- RLS for events
CREATE POLICY "Authenticated users can view all events"
  ON public.os_events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create events"
  ON public.os_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creator can update events"
  ON public.os_events FOR UPDATE TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Creator can delete events"
  ON public.os_events FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Super admins can update any event"
  ON public.os_events FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete any event"
  ON public.os_events FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- RLS for attendees
CREATE POLICY "Authenticated users can view attendees"
  ON public.os_event_attendees FOR SELECT TO authenticated USING (true);

CREATE POLICY "Event creator can manage attendees"
  ON public.os_event_attendees FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Attendee can update own status"
  ON public.os_event_attendees FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Event attendee can remove self"
  ON public.os_event_attendees FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_os_events_updated_at
  BEFORE UPDATE ON public.os_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.os_events;
