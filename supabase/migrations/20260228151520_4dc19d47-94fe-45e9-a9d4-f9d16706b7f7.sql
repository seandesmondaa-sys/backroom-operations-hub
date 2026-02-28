
-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'department_head', 'department_staff', 'general_staff');

-- 2. Create departments table
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- 3. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'general_staff',
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper: check if user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;

-- Helper: get user's department_id
CREATE OR REPLACE FUNCTION public.get_user_department(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT department_id FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- 5. RLS policies for departments
CREATE POLICY "Everyone can view departments"
  ON public.departments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can insert departments"
  ON public.departments FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update departments"
  ON public.departments FOR UPDATE
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete departments"
  ON public.departments FOR DELETE
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- 6. RLS policies for user_roles
CREATE POLICY "Authenticated users can view roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can assign roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can remove roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- 7. Updated_at trigger for departments
CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
