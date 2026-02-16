-- Fix the handle_new_user trigger to avoid unique constraint violations
-- The issue: phone field has UNIQUE constraint, but trigger inserts '' for all users
-- Solution: Use NULL for phone instead of empty string

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate the function with NULL for phone
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NULL,  -- Use NULL instead of '' to avoid unique constraint violations
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail the auth process
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Make phone nullable if it isn't already
ALTER TABLE public.profiles 
  ALTER COLUMN phone DROP NOT NULL;

-- Add a unique constraint that allows NULL values
-- First drop the old unique constraint if it exists
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_phone_key;

-- Create a unique index that allows multiple NULLs
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique_idx 
  ON public.profiles(phone) 
  WHERE phone IS NOT NULL;
