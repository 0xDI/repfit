-- Security improvements for the gym booking app
-- Run this script to enhance security measures

-- 1. Ensure all tables have RLS enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_overrides ENABLE ROW LEVEL SECURITY;

-- 2. Add rate limiting table for booking attempts
CREATE TABLE IF NOT EXISTS booking_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  attempt_time TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN DEFAULT false
);

-- Index for rate limiting checks
CREATE INDEX IF NOT EXISTS idx_booking_attempts_user_time ON booking_attempts(user_id, attempt_time);

-- RLS for booking_attempts
ALTER TABLE booking_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attempts" ON booking_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attempts" ON booking_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Add audit log table for admin actions
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for audit log queries
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_time ON admin_audit_log(admin_id, created_at);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON admin_audit_log(action);

-- RLS for admin_audit_log
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log" ON admin_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.is_admin = true OR profiles.role = 'admin')
    )
  );

CREATE POLICY "Admins can insert audit log" ON admin_audit_log
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.is_admin = true OR profiles.role = 'admin')
    )
  );

-- 4. Add function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, details)
  VALUES (auth.uid(), p_action, p_target_type, p_target_id, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Add constraint to prevent negative workout tokens
ALTER TABLE profiles ADD CONSTRAINT check_positive_tokens CHECK (workout_tokens >= 0);

-- 6. Add constraint to prevent overbooking
ALTER TABLE gym_sessions ADD CONSTRAINT check_available_slots CHECK (available_slots >= 0 AND available_slots <= total_slots);

-- 7. Add email validation
ALTER TABLE profiles ADD CONSTRAINT check_valid_phone 
  CHECK (phone IS NULL OR phone ~ '^[+]?[0-9\s\-$$$$]+$');

-- 8. Create function to check booking rate limits (prevent spam)
CREATE OR REPLACE FUNCTION check_booking_rate_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  recent_attempts INTEGER;
BEGIN
  -- Count booking attempts in the last minute
  SELECT COUNT(*) INTO recent_attempts
  FROM booking_attempts
  WHERE user_id = p_user_id
  AND attempt_time > NOW() - INTERVAL '1 minute';
  
  -- Allow max 5 booking attempts per minute
  RETURN recent_attempts < 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Add trigger to clean old booking attempts (keep last 24 hours only)
CREATE OR REPLACE FUNCTION cleanup_old_booking_attempts()
RETURNS trigger AS $$
BEGIN
  DELETE FROM booking_attempts
  WHERE attempt_time < NOW() - INTERVAL '24 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cleanup_booking_attempts ON booking_attempts;
CREATE TRIGGER trigger_cleanup_booking_attempts
  AFTER INSERT ON booking_attempts
  EXECUTE FUNCTION cleanup_old_booking_attempts();

-- 10. Update RLS policies for user_subscriptions
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.is_admin = true OR profiles.role = 'admin')
    )
  );

CREATE POLICY "Admins can manage subscriptions" ON user_subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.is_admin = true OR profiles.role = 'admin')
    )
  );

-- 11. Everyone can view subscription plans (for display purposes)
CREATE POLICY "Anyone can view subscription plans" ON subscription_plans
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage subscription plans" ON subscription_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.is_admin = true OR profiles.role = 'admin')
    )
  );

-- 12. Add security note comments
COMMENT ON TABLE profiles IS 'User profiles with RLS enabled. Users can only view/edit their own profile unless admin.';
COMMENT ON TABLE bookings IS 'Booking records with RLS enabled. Users can only view/manage their own bookings unless admin.';
COMMENT ON TABLE admin_audit_log IS 'Audit log for admin actions. Only admins can view and insert.';
COMMENT ON FUNCTION check_booking_rate_limit IS 'Rate limiting function to prevent booking spam - max 5 attempts per minute per user.';
