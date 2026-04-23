-- First, check if role column exists and add it if not
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
END $$;

-- Add constraint to ensure valid roles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_role_check'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_role_check 
        CHECK (role IN ('user', 'admin'));
    END IF;
END $$;

-- Update all existing profiles to have 'user' role if they're null
UPDATE public.profiles 
SET role = 'user' 
WHERE role IS NULL;

-- Set dimitris@devsagency.net as admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE id IN (
    SELECT id FROM auth.users 
    WHERE email = 'dimitris@devsagency.net'
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Verify the update worked
SELECT u.email, p.role 
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'dimitris@devsagency.net';
