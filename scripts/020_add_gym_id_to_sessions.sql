-- Migration: Add gym_id to gym_sessions, weekly_schedule, and schedule_overrides
-- This enables proper multi-tenant data isolation per gym

-- 1. Add gym_id to gym_sessions
ALTER TABLE public.gym_sessions ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_gym_sessions_gym_id ON public.gym_sessions(gym_id);

-- 2. Add gym_id to weekly_schedule
ALTER TABLE public.weekly_schedule ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_weekly_schedule_gym_id ON public.weekly_schedule(gym_id);

-- Drop old unique constraint (day_of_week, start_time) and replace with gym-scoped one
ALTER TABLE public.weekly_schedule DROP CONSTRAINT IF EXISTS weekly_schedule_day_of_week_start_time_key;

-- 3. Add gym_id to schedule_overrides
ALTER TABLE public.schedule_overrides ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_schedule_overrides_gym_id ON public.schedule_overrides(gym_id);

-- Drop old unique constraint (override_date) and replace with gym-scoped one
ALTER TABLE public.schedule_overrides DROP CONSTRAINT IF EXISTS schedule_overrides_override_date_key;

-- 4. Add gym_id to user_subscriptions (if not already there)
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_gym_id ON public.user_subscriptions(gym_id);

-- 5. Remove the old UNIQUE constraint on gym_sessions that prevented multiple gyms
-- from having sessions at the same date/time
ALTER TABLE public.gym_sessions DROP CONSTRAINT IF EXISTS gym_sessions_session_date_start_time_key;

-- 6. Backfill: assign existing sessions to the first gym owned by their creator
UPDATE public.gym_sessions gs
SET gym_id = g.id
FROM public.gyms g
WHERE gs.created_by = g.owner_id
  AND gs.gym_id IS NULL;

-- 7. Backfill: assign weekly_schedule rows to the first gym (if any gym exists)
UPDATE public.weekly_schedule ws
SET gym_id = (SELECT id FROM public.gyms ORDER BY created_at ASC LIMIT 1)
WHERE ws.gym_id IS NULL;

-- 8. Backfill: assign schedule_overrides rows to the first gym
UPDATE public.schedule_overrides so
SET gym_id = (SELECT id FROM public.gyms ORDER BY created_at ASC LIMIT 1)
WHERE so.gym_id IS NULL;

-- Verify
SELECT 'Migration complete' as status;
