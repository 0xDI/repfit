-- Fix infinite recursion in profiles RLS policies
-- Problem: is_admin() function queries profiles table, causing recursion

-- Drop the problematic function
DROP FUNCTION IF EXISTS public.is_admin(UUID);

-- Create new non-recursive version that sets search_path to bypass RLS
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  result BOOLEAN;
BEGIN
  -- Query directly without RLS by using a security definer function
  -- that sets the search_path explicitly
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND is_admin = true
  ) INTO result;
  
  RETURN COALESCE(result, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = public, pg_temp;

-- Alternatively, simplify the policies to not use the function for basic user access
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can insert profile" ON public.profiles;

-- Recreate with simpler logic that doesn't cause recursion
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can insert profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Add admin-specific policies separately
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );
