-- Fix phone constraint to allow NULL values for new users
-- They can update their phone number later in their profile

-- First, drop the unique constraint if it exists
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_phone_key;

-- Make phone nullable
ALTER TABLE public.profiles 
  ALTER COLUMN phone DROP NOT NULL;

-- Add a new unique constraint that allows NULL values
-- (NULL values are not considered equal, so multiple NULLs are allowed)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique 
  ON public.profiles(phone) 
  WHERE phone IS NOT NULL AND phone != '';

-- Update any existing empty string phone values to NULL
UPDATE public.profiles 
SET phone = NULL 
WHERE phone = '';
