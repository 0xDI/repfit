-- Complete Database Setup for PB3 Training
-- Run this script in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.gym_sessions CASCADE;
DROP TABLE IF EXISTS public.admin_messages CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  phone text,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  subscription_status text NOT NULL DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'pending')),
  tokens_remaining integer NOT NULL DEFAULT 0,
  tokens_per_period integer NOT NULL DEFAULT 8,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create gym_sessions table
CREATE TABLE public.gym_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  total_slots integer NOT NULL DEFAULT 10,
  available_slots integer NOT NULL DEFAULT 10,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(date, start_time)
);

-- Create bookings table
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.gym_sessions(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, session_id)
);

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create admin_messages table
CREATE TABLE public.admin_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  message text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

-- Simple RLS Policies (no recursion)

-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can manage own profile"
  ON public.profiles
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Gym Sessions: Everyone can view, but only check admin via direct auth metadata
CREATE POLICY "Anyone can view gym sessions"
  ON public.gym_sessions
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage gym sessions"
  ON public.gym_sessions
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Bookings: Users can view their own bookings
CREATE POLICY "Users can view own bookings"
  ON public.bookings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookings"
  ON public.bookings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
  ON public.bookings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Notifications: Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admin Messages: Everyone can view active messages
CREATE POLICY "Anyone can view active admin messages"
  ON public.admin_messages
  FOR SELECT
  USING (active = true);

-- Create function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.gym_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.admin_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
