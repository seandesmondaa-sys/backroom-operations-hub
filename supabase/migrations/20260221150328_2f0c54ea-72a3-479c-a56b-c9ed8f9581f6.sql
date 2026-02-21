
-- Profiles table for authenticated users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Message threads (tied to entities)
CREATE TABLE public.message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('project', 'client', 'deal', 'general')),
  entity_id TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all threads" ON public.message_threads
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create threads" ON public.message_threads
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Thread creator can update" ON public.message_threads
  FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE TRIGGER update_threads_updated_at
  BEFORE UPDATE ON public.message_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Thread participants
CREATE TABLE public.thread_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.message_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(thread_id, user_id)
);

ALTER TABLE public.thread_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view participants" ON public.thread_participants
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can join threads" ON public.thread_participants
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave threads" ON public.thread_participants
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.message_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view messages" ON public.messages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can edit own messages" ON public.messages
  FOR UPDATE TO authenticated USING (auth.uid() = sender_id);

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'message',
  title TEXT NOT NULL,
  body TEXT,
  thread_id UUID REFERENCES public.message_threads(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to notify thread participants when a message is sent
CREATE OR REPLACE FUNCTION public.notify_thread_participants()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _thread_title TEXT;
  _sender_name TEXT;
  _participant RECORD;
BEGIN
  SELECT title INTO _thread_title FROM public.message_threads WHERE id = NEW.thread_id;
  SELECT display_name INTO _sender_name FROM public.profiles WHERE user_id = NEW.sender_id;

  FOR _participant IN
    SELECT user_id FROM public.thread_participants WHERE thread_id = NEW.thread_id AND user_id != NEW.sender_id
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, thread_id)
    VALUES (
      _participant.user_id,
      'message',
      _sender_name || ' in ' || _thread_title,
      LEFT(NEW.content, 100),
      NEW.thread_id
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_thread_participants();
