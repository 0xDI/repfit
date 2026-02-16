-- Add trial_end_date column to gyms table for 7-day free trial
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/xypnkpsgujjtxedrdahf/sql/new

ALTER TABLE public.gyms ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ;

-- Verify the column was added
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'gyms' AND column_name = 'trial_end_date';
