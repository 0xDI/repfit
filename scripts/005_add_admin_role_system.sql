-- Add role column to profiles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN role TEXT NOT NULL DEFAULT 'user';
  END IF;
END $$;

-- Add check constraint to ensure role is either 'user' or 'admin'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'profiles' 
    AND constraint_name = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('user', 'admin'));
  END IF;
END $$;

-- Create an index on role for faster admin checks
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Make dimitris@devsagency.net an admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email = 'dimitris@devsagency.net'
);

-- Create a helper function to check if a user is admin
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
$$;

-- Create a helper function to get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;
