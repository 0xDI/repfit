-- REPFIT Database Triggers

-- Trigger to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    role,
    is_admin,
    workout_tokens,
    tokens,
    subscription_status
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NULL),
    'member',
    false,
    0,
    0,
    'inactive'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update class schedule updated_at
CREATE OR REPLACE FUNCTION update_class_schedule_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_class_schedule_timestamp ON class_schedules;
CREATE TRIGGER trigger_update_class_schedule_timestamp
  BEFORE UPDATE ON class_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_class_schedule_timestamp();

-- Trigger to update gym member timestamp
CREATE OR REPLACE FUNCTION update_gym_member_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_gym_member_timestamp ON gym_members;
CREATE TRIGGER trigger_update_gym_member_timestamp
  BEFORE UPDATE ON gym_members
  FOR EACH ROW
  EXECUTE FUNCTION update_gym_member_timestamp();

-- Trigger to update class timestamp
CREATE OR REPLACE FUNCTION update_class_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_class_timestamp ON classes;
CREATE TRIGGER trigger_update_class_timestamp
  BEFORE UPDATE ON classes
  FOR EACH ROW
  EXECUTE FUNCTION update_class_timestamp();
