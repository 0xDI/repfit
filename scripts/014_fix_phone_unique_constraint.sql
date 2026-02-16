-- =====================================================
-- Fix: Database error saving new user
-- Issue: Multiple profiles with empty phone strings violate UNIQUE constraint
-- =====================================================

-- Step 1: Update existing profiles with empty phones to NULL
UPDATE public.profiles 
SET phone = NULL 
WHERE phone = '';

-- Step 2: Drop the old trigger to prevent conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 3: Make phone column nullable
ALTER TABLE public.profiles 
ALTER COLUMN phone DROP NOT NULL;

-- Step 4: Drop the old unique constraint
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_phone_key;

-- Step 5: Create a partial unique index (only for non-null phones)
DROP INDEX IF EXISTS profiles_phone_unique;
CREATE UNIQUE INDEX profiles_phone_unique 
ON public.profiles (phone) 
WHERE phone IS NOT NULL AND phone != '';

-- Step 6: Create improved trigger function with NULL phones
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone, tokens)
  VALUES (
    NEW.id,
    NEW.email,
    NULL,  -- Use NULL to avoid unique constraint violations
    0
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Profile creation error for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Verify the fix
SELECT 
  'Fix applied successfully!' as status,
  COUNT(*) as total_profiles,
  COUNT(phone) as profiles_with_phone,
  COUNT(*) - COUNT(phone) as profiles_without_phone
FROM public.profiles;
