-- Add workout_duration_minutes column to gym_sessions table
ALTER TABLE public.gym_sessions 
ADD COLUMN IF NOT EXISTS workout_duration_minutes INTEGER DEFAULT 60;

-- Add check constraint to ensure duration is positive
ALTER TABLE public.gym_sessions 
ADD CONSTRAINT workout_duration_positive CHECK (workout_duration_minutes > 0);
