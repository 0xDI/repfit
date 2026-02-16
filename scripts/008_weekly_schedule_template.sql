-- Create weekly schedule template table
CREATE TABLE IF NOT EXISTS public.weekly_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_slots INTEGER NOT NULL DEFAULT 10,
  workout_duration_minutes INTEGER NOT NULL DEFAULT 60,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(day_of_week, start_time)
);

-- Create date overrides table for temporary changes
CREATE TABLE IF NOT EXISTS public.schedule_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  override_date DATE NOT NULL UNIQUE,
  is_closed BOOLEAN NOT NULL DEFAULT false, -- If true, gym is closed this day
  start_time TIME, -- Custom start time (null = use template)
  end_time TIME, -- Custom end time (null = use template)
  total_slots INTEGER, -- Custom slots (null = use template)
  reason TEXT, -- Optional reason for the override
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.weekly_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_overrides ENABLE ROW LEVEL SECURITY;

-- RLS policies for weekly_schedule (admins can manage, all authenticated can read)
CREATE POLICY "Anyone can view weekly schedule" ON public.weekly_schedule
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert weekly schedule" ON public.weekly_schedule
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update weekly schedule" ON public.weekly_schedule
  FOR UPDATE USING (true);

CREATE POLICY "Admins can delete weekly schedule" ON public.weekly_schedule
  FOR DELETE USING (true);

-- RLS policies for schedule_overrides
CREATE POLICY "Anyone can view schedule overrides" ON public.schedule_overrides
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert schedule overrides" ON public.schedule_overrides
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update schedule overrides" ON public.schedule_overrides
  FOR UPDATE USING (true);

CREATE POLICY "Admins can delete schedule overrides" ON public.schedule_overrides
  FOR DELETE USING (true);
