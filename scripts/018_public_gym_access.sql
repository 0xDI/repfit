-- 1. Add columns (run this first!)
ALTER TABLE public.gyms ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.gyms ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.gyms ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.gyms ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- 2. Function to generate slugs (with uniqueness check via ID suffix)
DROP FUNCTION IF EXISTS public.generate_gym_slug(text);
CREATE OR REPLACE FUNCTION public.generate_gym_slug(name text, gym_id uuid) RETURNS text AS $$
DECLARE
  new_slug text;
BEGIN
  -- Simple slugify: lowercase, replace spaces with dashes, remove non-alphanumeric
  new_slug := lower(regexp_replace(name, '[^a-zA-Z0-9\\s]', '', 'g'));
  new_slug := regexp_replace(new_slug, '\\s+', '-', 'g');
  -- Append first 4 chars of UUID to ensure uniqueness
  RETURN new_slug || '-' || substring(gym_id::text, 1, 4);
END;
$$ LANGUAGE plpgsql;

-- 3. Allow public SELECT on active gyms (for /gym/[slug] pages)
DROP POLICY IF EXISTS "Anyone can view active gyms" ON public.gyms;
CREATE POLICY "Anyone can view active gyms" ON public.gyms
  FOR SELECT USING (is_active = true OR is_active IS NULL);

-- 4. Ensure gym_members table exists
CREATE TABLE IF NOT EXISTS public.gym_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(gym_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_gym_members_user ON public.gym_members(user_id);
CREATE INDEX IF NOT EXISTS idx_gym_members_gym ON public.gym_members(gym_id);

ALTER TABLE public.gym_members ENABLE ROW LEVEL SECURITY;

-- 5. RLS for gym_members
DROP POLICY IF EXISTS "Members can view their own memberships" ON public.gym_members;
CREATE POLICY "Members can view their own memberships" ON public.gym_members
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Gym owners can view their gym members" ON public.gym_members;
CREATE POLICY "Gym owners can view their gym members" ON public.gym_members
  FOR SELECT USING (
    gym_id IN (SELECT id FROM public.gyms WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Authenticated users can join gyms" ON public.gym_members;
CREATE POLICY "Authenticated users can join gyms" ON public.gym_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND role = 'member'
  );

-- 6. Generate slugs for any gyms that don't have one
UPDATE public.gyms 
SET slug = generate_gym_slug(name, id) 
WHERE slug IS NULL OR slug = '';

-- 7. Verify
SELECT id, name, slug, is_active FROM public.gyms LIMIT 10;
