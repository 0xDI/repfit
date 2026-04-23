-- Create a trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, full_name, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'is_admin')::boolean, false)
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

-- Create function to automatically decrease available slots when booking
CREATE OR REPLACE FUNCTION public.handle_new_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Decrease available slots
  UPDATE public.gym_sessions
  SET available_slots = available_slots - 1
  WHERE id = NEW.session_id AND available_slots > 0;
  
  -- Decrease user's workout tokens
  UPDATE public.profiles
  SET workout_tokens = workout_tokens - 1
  WHERE id = NEW.user_id AND workout_tokens > 0;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_booking_created ON public.bookings;

CREATE TRIGGER on_booking_created
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed')
  EXECUTE FUNCTION public.handle_new_booking();

-- Create function to restore slots when booking is cancelled
CREATE OR REPLACE FUNCTION public.handle_booking_cancellation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status = 'confirmed' THEN
    -- Increase available slots
    UPDATE public.gym_sessions
    SET available_slots = available_slots + 1
    WHERE id = NEW.session_id;
    
    -- Restore user's workout token
    UPDATE public.profiles
    SET workout_tokens = workout_tokens + 1
    WHERE id = NEW.user_id;
    
    -- Set cancelled timestamp
    NEW.cancelled_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_booking_cancelled ON public.bookings;

CREATE TRIGGER on_booking_cancelled
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION public.handle_booking_cancellation();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_gym_sessions_updated_at ON public.gym_sessions;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gym_sessions_updated_at
  BEFORE UPDATE ON public.gym_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
