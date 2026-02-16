-- Script to add missing gyms table and related columns
-- Run this in Supabase SQL Editor

-- 1. Create the gyms table with all required columns
CREATE TABLE IF NOT EXISTS public.gyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'US',
  timezone TEXT DEFAULT 'America/New_York',
  payment_method TEXT DEFAULT 'manual',
  onboarding_completed BOOLEAN DEFAULT false,
  subscription_status TEXT DEFAULT 'trial',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add missing columns to profiles table if needed
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES public.gyms(id);

-- 3. Enable RLS on gyms table
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for gyms
DROP POLICY IF EXISTS "Users can view their own gyms" ON public.gyms;
CREATE POLICY "Users can view their own gyms" ON public.gyms
  FOR SELECT USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can create gyms" ON public.gyms;
CREATE POLICY "Users can create gyms" ON public.gyms
  FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own gyms" ON public.gyms;
CREATE POLICY "Users can update their own gyms" ON public.gyms
  FOR UPDATE USING (owner_id = auth.uid());

-- 5. Create updated_at trigger for gyms
CREATE OR REPLACE FUNCTION update_gyms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_gyms_updated_at ON public.gyms;
CREATE TRIGGER update_gyms_updated_at
  BEFORE UPDATE ON public.gyms
  FOR EACH ROW
  EXECUTE FUNCTION update_gyms_updated_at();

-- 6. Verify setup
SELECT 'gyms table created' AS status;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'gyms' ORDER BY ordinal_position;
