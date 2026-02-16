-- =============================================================================
-- REPFIT Master Database Setup
-- Run this in Supabase SQL Editor to initialize a fresh database
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. CORE TABLES
-- =============================================================================

-- Profiles table for user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone VARCHAR(20),
  full_name VARCHAR(255),
  workout_tokens INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT false,
  subscription_plan VARCHAR(50),
  subscription_status VARCHAR(20) DEFAULT 'inactive',
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  tokens_per_period INTEGER DEFAULT 0,
  age INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gym sessions table for admin to manage time slots
CREATE TABLE IF NOT EXISTS public.gym_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_slots INTEGER NOT NULL DEFAULT 10,
  available_slots INTEGER NOT NULL DEFAULT 10,
  workout_duration_minutes INTEGER DEFAULT 60,
  is_open BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_date, start_time),
  CONSTRAINT check_available_slots CHECK (available_slots >= 0 AND available_slots <= total_slots)
);

-- Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.gym_sessions(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'confirmed',
  booked_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, session_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin messages table (announcements)
CREATE TABLE IF NOT EXISTS public.admin_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Weekly schedule template table
CREATE TABLE IF NOT EXISTS public.weekly_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_slots INTEGER NOT NULL DEFAULT 10,
  workout_duration_minutes INTEGER NOT NULL DEFAULT 60,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(day_of_week, start_time)
);

-- Date overrides table for temporary changes
CREATE TABLE IF NOT EXISTS public.schedule_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  override_date DATE NOT NULL UNIQUE,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  start_time TIME,
  end_time TIME,
  total_slots INTEGER,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 2. SUBSCRIPTION SYSTEM
-- =============================================================================

-- Subscription plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  training_count INTEGER NOT NULL,
  duration_days INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  notification_threshold INTEGER NOT NULL DEFAULT 2,
  notification_type VARCHAR(50) NOT NULL DEFAULT 'trainings',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  plan_name VARCHAR(255),
  plan_price DECIMAL(10,2),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  remaining_trainings INTEGER NOT NULL,
  total_trainings INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  payment_date TIMESTAMPTZ,
  low_balance_notified BOOLEAN NOT NULL DEFAULT false,
  expiration_notified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment history table
CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payment_method VARCHAR(100),
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 3. SECURITY TABLES
-- =============================================================================

-- Rate limiting table for booking attempts
CREATE TABLE IF NOT EXISTS public.booking_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  attempt_time TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN DEFAULT false
);

-- Audit log table for admin actions
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 4. INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_gym_sessions_date ON public.gym_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_session_id ON public.bookings(session_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON public.payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_subscription_id ON public.payment_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_booking_attempts_user_time ON public.booking_attempts(user_id, attempt_time);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_time ON public.admin_audit_log(admin_id, created_at);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON public.admin_audit_log(action);

-- Partial unique index for phone (allows NULL)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique_idx 
  ON public.profiles(phone) 
  WHERE phone IS NOT NULL;

-- =============================================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 6. RLS POLICIES
-- =============================================================================

-- Profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Gym Sessions
CREATE POLICY "Anyone can view open gym sessions" ON public.gym_sessions
  FOR SELECT USING (is_open = true OR auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage gym sessions" ON public.gym_sessions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Bookings
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel their own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings" ON public.bookings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can manage all bookings" ON public.bookings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Admin Messages
CREATE POLICY "Anyone can view active admin messages" ON public.admin_messages
  FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Admins can manage admin messages" ON public.admin_messages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Weekly Schedule
CREATE POLICY "Anyone can view weekly schedule" ON public.weekly_schedule
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage weekly schedule" ON public.weekly_schedule
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Schedule Overrides
CREATE POLICY "Anyone can view schedule overrides" ON public.schedule_overrides
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage schedule overrides" ON public.schedule_overrides
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Subscription Plans
CREATE POLICY "Anyone can view subscription plans" ON public.subscription_plans
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage subscription plans" ON public.subscription_plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- User Subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage subscriptions" ON public.user_subscriptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Payment History
CREATE POLICY "Users can view own payments" ON public.payment_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage payments" ON public.payment_history
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Booking Attempts
CREATE POLICY "Users can view own attempts" ON public.booking_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attempts" ON public.booking_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin Audit Log
CREATE POLICY "Admins can view audit log" ON public.admin_audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can insert audit log" ON public.admin_audit_log
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- =============================================================================
-- 7. TRIGGER FUNCTIONS
-- =============================================================================

-- Function to create profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NULL,  -- Use NULL to avoid unique constraint violations
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_gym_sessions_updated_at ON public.gym_sessions;
CREATE TRIGGER update_gym_sessions_updated_at
  BEFORE UPDATE ON public.gym_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new bookings
CREATE OR REPLACE FUNCTION public.handle_new_booking()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.gym_sessions
  SET available_slots = available_slots - 1
  WHERE id = NEW.session_id AND available_slots > 0;
  
  UPDATE public.profiles
  SET workout_tokens = workout_tokens - 1
  WHERE id = NEW.user_id AND workout_tokens > 0;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_booking_created ON public.bookings;
CREATE TRIGGER on_booking_created
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed')
  EXECUTE FUNCTION public.handle_new_booking();

-- Function to handle booking cancellation
CREATE OR REPLACE FUNCTION public.handle_booking_cancellation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status = 'confirmed' THEN
    UPDATE public.gym_sessions
    SET available_slots = available_slots + 1
    WHERE id = NEW.session_id;
    
    UPDATE public.profiles
    SET workout_tokens = workout_tokens + 1
    WHERE id = NEW.user_id;
    
    NEW.cancelled_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_booking_cancelled ON public.bookings;
CREATE TRIGGER on_booking_cancelled
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION public.handle_booking_cancellation();

-- Function to update subscription status
CREATE OR REPLACE FUNCTION public.update_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_date < CURRENT_DATE THEN
    NEW.status = 'expired';
  ELSIF NEW.remaining_trainings <= 0 THEN
    NEW.status = 'expired';
  ELSE
    NEW.status = 'active';
  END IF;
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_subscription_status ON public.user_subscriptions;
CREATE TRIGGER trigger_update_subscription_status
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_subscription_status();

-- Function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.admin_audit_log (admin_id, action, target_type, target_id, details)
  VALUES (auth.uid(), p_action, p_target_type, p_target_id, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check booking rate limits
CREATE OR REPLACE FUNCTION public.check_booking_rate_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  recent_attempts INTEGER;
BEGIN
  SELECT COUNT(*) INTO recent_attempts
  FROM public.booking_attempts
  WHERE user_id = p_user_id
  AND attempt_time > NOW() - INTERVAL '1 minute';
  
  RETURN recent_attempts < 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old booking attempts
CREATE OR REPLACE FUNCTION public.cleanup_old_booking_attempts()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.booking_attempts
  WHERE attempt_time < NOW() - INTERVAL '24 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cleanup_booking_attempts ON public.booking_attempts;
CREATE TRIGGER trigger_cleanup_booking_attempts
  AFTER INSERT ON public.booking_attempts
  EXECUTE FUNCTION public.cleanup_old_booking_attempts();

-- =============================================================================
-- 8. FINAL VERIFICATION
-- =============================================================================

SELECT 
  'Database setup complete!' as status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count;
