-- ============================================
-- MANUAL FIX FOR ADMIN PANEL ACCESS
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Drop ALL existing RLS policies to prevent infinite recursion
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow admins to view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow admins to update all profiles" ON public.profiles;

-- Step 2: Temporarily disable RLS
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 3: Ensure dimitris@devsagency.net has admin access
-- First, find if the user exists
DO $$
DECLARE
  user_id_var uuid;
BEGIN
  -- Get the user ID
  SELECT id INTO user_id_var FROM auth.users WHERE email = 'dimitris@devsagency.net';
  
  IF user_id_var IS NOT NULL THEN
    -- Check if profile exists
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id_var) THEN
      -- Update existing profile
      UPDATE public.profiles 
      SET is_admin = true, role = 'admin'
      WHERE id = user_id_var;
      RAISE NOTICE 'Updated existing profile for dimitris@devsagency.net';
    ELSE
      -- Create new profile
      INSERT INTO public.profiles (id, full_name, is_admin, role, workout_tokens)
      VALUES (user_id_var, 'Admin', true, 'admin', 0);
      RAISE NOTICE 'Created new profile for dimitris@devsagency.net';
    END IF;
  ELSE
    RAISE NOTICE 'User dimitris@devsagency.net not found in auth.users';
  END IF;
END $$;

-- Step 4: Create SIMPLE RLS policies that won't cause recursion
CREATE POLICY "allow_own_profile_access"
  ON public.profiles
  FOR ALL
  USING (auth.uid() = id);

-- Step 5: Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 6: Verify the setup
SELECT 
  u.email,
  p.id,
  p.full_name,
  p.is_admin,
  p.role,
  p.workout_tokens
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'dimitris@devsagency.net';
