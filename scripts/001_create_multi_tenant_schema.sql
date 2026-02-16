-- REPFIT Multi-Tenant Schema Setup
-- This creates the foundational structure for gym SaaS

-- First, ensure gyms table exists with all necessary columns
CREATE TABLE IF NOT EXISTS gyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'US',
  timezone TEXT DEFAULT 'America/New_York',
  
  -- Subscription & Payment
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'trial',
  subscription_plan TEXT DEFAULT 'starter',
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  subscription_ends_at TIMESTAMPTZ,
  payment_method TEXT DEFAULT 'manual',
  
  -- Settings
  booking_window_days INTEGER DEFAULT 14,
  max_bookings_per_member INTEGER DEFAULT 5,
  allow_waitlist BOOLEAN DEFAULT true,
  auto_confirm_bookings BOOLEAN DEFAULT true,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  onboarding_completed BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on owner_id for fast gym lookup
CREATE INDEX IF NOT EXISTS idx_gyms_owner_id ON gyms(owner_id);
CREATE INDEX IF NOT EXISTS idx_gyms_slug ON gyms(slug);
CREATE INDEX IF NOT EXISTS idx_gyms_stripe_customer ON gyms(stripe_customer_id);

-- Enable RLS on gyms
ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gyms
CREATE POLICY "Users can create gyms"
  ON gyms FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners and members can view gyms"
  ON gyms FOR SELECT
  USING (
    auth.uid() = owner_id OR
    id IN (
      SELECT gym_id FROM gym_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Gym admins can update their gyms"
  ON gyms FOR UPDATE
  USING (
    auth.uid() = owner_id OR
    id IN (
      SELECT gym_id FROM gym_members 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

-- Function to create gym slug from name
CREATE OR REPLACE FUNCTION generate_gym_slug(gym_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- Convert to lowercase and replace spaces/special chars with hyphens
  base_slug := LOWER(REGEXP_REPLACE(gym_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := TRIM(BOTH '-' FROM base_slug);
  final_slug := base_slug;
  
  -- Check for uniqueness and append number if needed
  WHILE EXISTS (SELECT 1 FROM gyms WHERE slug = final_slug) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically generate slug if not provided
CREATE OR REPLACE FUNCTION set_gym_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_gym_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_gym_slug ON gyms;
CREATE TRIGGER trigger_set_gym_slug
  BEFORE INSERT ON gyms
  FOR EACH ROW
  EXECUTE FUNCTION set_gym_slug();

-- Updated at trigger for gyms
CREATE OR REPLACE FUNCTION update_gym_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_gym_timestamp ON gyms;
CREATE TRIGGER trigger_update_gym_timestamp
  BEFORE UPDATE ON gyms
  FOR EACH ROW
  EXECUTE FUNCTION update_gym_updated_at();

-- Function to add gym owner as member automatically
CREATE OR REPLACE FUNCTION add_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO gym_members (gym_id, user_id, role, status)
  VALUES (NEW.id, NEW.owner_id, 'owner', 'active')
  ON CONFLICT (gym_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_add_owner_as_member ON gyms;
CREATE TRIGGER trigger_add_owner_as_member
  AFTER INSERT ON gyms
  FOR EACH ROW
  EXECUTE FUNCTION add_owner_as_member();
