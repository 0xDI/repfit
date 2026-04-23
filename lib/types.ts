export interface Profile {
  id: string
  phone: string
  full_name: string | null
  workout_tokens: number
  is_admin: boolean
  subscription_plan: string | null
  subscription_status: string
  subscription_start_date: string | null
  subscription_end_date: string | null
  tokens_per_period: number
  created_at: string
  updated_at: string
}

export interface GymSession {
  id: string
  session_date: string
  start_time: string
  end_time: string
  total_slots: number
  available_slots: number
  is_open: boolean
  workout_duration_minutes: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface GymSessionWithParticipants extends GymSession {
  participants?: Array<{
    user_id: string
    full_name: string | null
  }>
}

export interface Booking {
  id: string
  user_id: string
  session_id: string
  status: "confirmed" | "cancelled"
  booked_at: string
  cancelled_at: string | null
  created_at: string
  gym_sessions?: GymSession
  profiles?: Profile
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

export interface AdminMessage {
  id: string
  title: string
  message: string
  is_active: boolean
  created_by: string | null
  created_at: string
  expires_at: string | null
}

export interface WeeklySchedule {
  id: string
  day_of_week: number // 0 = Sunday, 6 = Saturday
  start_time: string
  end_time: string
  total_slots: number
  workout_duration_minutes: number
  is_enabled: boolean
  created_at: string
  updated_at: string
}

export interface ScheduleOverride {
  id: string
  override_date: string
  is_closed: boolean
  start_time: string | null
  end_time: string | null
  total_slots: number | null
  reason: string | null
  created_at: string
  updated_at: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  description: string | null
  training_count: number
  duration_days: number
  price: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserSubscription {
  id: string
  user_id: string
  plan_id: string
  plan_name: string
  plan_price: number
  start_date: string
  end_date: string
  remaining_trainings: number
  total_trainings: number
  status: "active" | "expired" | "cancelled"
  low_balance_notified: boolean
  expiration_notified: boolean
  created_at: string
  updated_at: string
  subscription_plans?: SubscriptionPlan
  profiles?: Profile
}

export interface PaymentHistory {
  id: string
  user_id: string
  subscription_id: string | null
  amount: number
  payment_date: string
  payment_method: string | null
  notes: string | null
  created_by: string | null
  created_at: string
}
