-- COPY THIS ENTIRE FILE AND RUN IT IN YOUR SUPABASE SQL EDITOR
-- This will fix the "Database error saving new user" issue

-- Step 1: Update all empty phone strings to NULL
UPDATE public.profiles SET phone = NULL WHERE phone = '';

-- Step 2: Drop existing constraints and indexes
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_phone_key;
DROP INDEX IF EXISTS profiles_phone_unique;

-- Step 3: Make phone nullable
ALTER TABLE public.profiles ALTER COLUMN phone DROP NOT NULL;

-- Step 4: Create partial unique index (only for non-null phones)
CREATE UNIQUE INDEX profiles_phone_unique ON public.profiles (phone) WHERE phone IS NOT NULL;

-- Step 5: Recreate the trigger function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone, tokens)
  VALUES (NEW.id, NEW.email, NULL, 0)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verify the fix
SELECT column_name, is_nullable FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'phone';
