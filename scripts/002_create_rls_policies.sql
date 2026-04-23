-- REPFIT RLS Policies for Multi-Tenancy
-- Ensures data isolation between gyms

-- Helper function to get user's gym IDs
CREATE OR REPLACE FUNCTION user_gym_ids(user_id UUID)
RETURNS TABLE (gym_id UUID) AS $$
BEGIN
  RETURN QUERY 
  SELECT gm.gym_id 
  FROM gym_members gm 
  WHERE gm.user_id = user_gym_ids.user_id 
  AND gm.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Classes RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view classes"
  ON classes FOR SELECT
  USING (gym_id IN (SELECT user_gym_ids(auth.uid())));

CREATE POLICY "Gym admins can manage classes"
  ON classes FOR ALL
  USING (
    gym_id IN (
      SELECT gm.gym_id FROM gym_members gm
      WHERE gm.user_id = auth.uid() 
      AND gm.role IN ('admin', 'owner')
      AND gm.status = 'active'
    )
  );

-- Class Schedules RLS
ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view schedules"
  ON class_schedules FOR SELECT
  USING (gym_id IN (SELECT user_gym_ids(auth.uid())));

CREATE POLICY "Gym admins can manage schedules"
  ON class_schedules FOR ALL
  USING (
    gym_id IN (
      SELECT gm.gym_id FROM gym_members gm
      WHERE gm.user_id = auth.uid() 
      AND gm.role IN ('admin', 'owner')
      AND gm.status = 'active'
    )
  );

-- Gym Members RLS
ALTER TABLE gym_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view members of their gyms"
  ON gym_members FOR SELECT
  USING (gym_id IN (SELECT user_gym_ids(auth.uid())));

CREATE POLICY "Gym admins can manage members"
  ON gym_members FOR ALL
  USING (
    gym_id IN (
      SELECT gm.gym_id FROM gym_members gm
      WHERE gm.user_id = auth.uid() 
      AND gm.role IN ('admin', 'owner')
      AND gm.status = 'active'
    )
  );

-- Bookings RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own bookings"
  ON bookings FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own bookings"
  ON bookings FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can view all bookings"
  ON bookings FOR SELECT
  USING (
    session_id IN (
      SELECT gs.id FROM gym_sessions gs
      WHERE EXISTS (
        SELECT 1 FROM gym_members gm
        WHERE gm.user_id = auth.uid()
        AND gm.status = 'active'
      )
    )
  );

-- Gym Sessions RLS
ALTER TABLE gym_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view sessions"
  ON gym_sessions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage sessions"
  ON gym_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM gym_members gm
      WHERE gm.user_id = auth.uid()
      AND gm.role IN ('admin', 'owner')
      AND gm.status = 'active'
    )
  );

-- User Profiles RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can view all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gym_members gm
      WHERE gm.user_id = auth.uid()
      AND gm.status = 'active'
    )
  );

-- Subscription Plans RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active plans"
  ON subscription_plans FOR SELECT
  USING (is_active = true AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage plans"
  ON subscription_plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.is_admin = true
    )
  );

-- User Subscriptions RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON user_subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can manage subscriptions"
  ON user_subscriptions FOR ALL
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.is_admin = true
    )
  );

-- Notifications RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Payment History RLS
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON payment_history FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can view all payments"
  ON payment_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.is_admin = true
    )
  );

-- Admin Messages RLS
ALTER TABLE admin_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON admin_messages FOR SELECT
  USING (user_id = auth.uid() OR admin_id = auth.uid());

CREATE POLICY "Users can create messages"
  ON admin_messages FOR INSERT
  WITH CHECK (user_id = auth.uid() OR admin_id = auth.uid());

CREATE POLICY "Authenticated users can manage messages"
  ON admin_messages FOR ALL
  USING (
    user_id = auth.uid() OR 
    admin_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.is_admin = true
    )
  );
