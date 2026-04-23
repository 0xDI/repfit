"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

async function checkIsAdmin(): Promise<{ isAdmin: boolean; error?: string }> {
  const supabase = await createClient()
  const adminClient = await createAdminClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { isAdmin: false, error: "Not authenticated" }
  }

  // Global admin via profile
  const { data: profile } = await adminClient.from("profiles").select("role, is_admin").eq("id", user.id).single()
  if (profile && (profile.role === "admin" || profile.is_admin === true)) {
    return { isAdmin: true }
  }

  // Gym owner: user owns at least one gym (same as dashboard access)
  const { data: ownedGym } = await adminClient
    .from("gyms")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle()
  if (ownedGym) {
    return { isAdmin: true }
  }

  return { isAdmin: false, error: "Not authorized" }
}

async function getActiveGymId(): Promise<string | null> {
  const supabase = await createClient()
  const adminClient = await createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const cookieStore = await cookies()
  const activeGymCookie = cookieStore.get("active_gym_id")?.value

  if (activeGymCookie) {
    const { data: gym } = await adminClient.from("gyms").select("id").eq("id", activeGymCookie).eq("owner_id", user.id).single()
    if (gym) return gym.id
  }

  const { data: gym } = await adminClient.from("gyms").select("id").eq("owner_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle()
  return gym?.id || null
}

export async function createSession(data: {
  session_date: string
  start_time: string
  end_time: string
  total_slots: number
  workout_duration_minutes?: number
}) {
  const { isAdmin, error } = await checkIsAdmin()
  if (!isAdmin) {
    return { success: false, error: error || "Not authorized" }
  }

  const supabase = await createClient()
  const adminClient = await createAdminClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const gymId = await getActiveGymId()
  if (!gymId) return { success: false, error: "No gym found" }

  const durationMinutes = data.workout_duration_minutes || 60
  const slots = generateTimeSlots(data.start_time, data.end_time, durationMinutes)

  const sessions = slots.map((slot) => ({
    session_date: data.session_date,
    start_time: slot.start,
    end_time: slot.end,
    total_slots: data.total_slots,
    available_slots: data.total_slots,
    created_by: user.id,
    gym_id: gymId,
    is_open: true,
  }))

  const { error: insertError } = await adminClient.from("gym_sessions").insert(sessions)

  if (insertError) {
    return { success: false, error: insertError.message }
  }

  revalidatePath("/admin/sessions")
  return { success: true, count: sessions.length }
}

export async function updateSession(
  id: string,
  data: {
    total_slots?: number
    is_open?: boolean
    workout_duration_minutes?: number
  },
) {
  const { isAdmin, error } = await checkIsAdmin()
  if (!isAdmin) {
    return { success: false, error: error || "Not authorized" }
  }

  const supabase = await createAdminClient()

  const { error: updateError } = await supabase.from("gym_sessions").update(data).eq("id", id)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  revalidatePath("/admin/sessions")
  return { success: true }
}

export async function deleteSession(id: string) {
  const { isAdmin, error } = await checkIsAdmin()
  if (!isAdmin) {
    return { success: false, error: error || "Not authorized" }
  }

  const supabase = await createAdminClient()

  const { error: deleteError } = await supabase.from("gym_sessions").delete().eq("id", id)

  if (deleteError) {
    return { success: false, error: deleteError.message }
  }

  revalidatePath("/admin/sessions")
  return { success: true }
}

export async function deleteAllSessions() {
  const { isAdmin, error } = await checkIsAdmin()
  if (!isAdmin) {
    return { success: false, error: error || "Not authorized" }
  }

  const supabase = await createAdminClient()
  const gymId = await getActiveGymId()
  if (!gymId) return { success: false, error: "No gym found" }

  // Get session IDs for this gym to scope the booking deletes
  const { data: gymSessions } = await supabase.from("gym_sessions").select("id").eq("gym_id", gymId)
  const sessionIds = gymSessions?.map(s => s.id) || []

  if (sessionIds.length > 0) {
    const { error: bookingsError } = await supabase
      .from("bookings")
      .delete()
      .in("session_id", sessionIds)

    if (bookingsError) {
      return { success: false, error: bookingsError.message }
    }
  }

  const { error: deleteError } = await supabase
    .from("gym_sessions")
    .delete()
    .eq("gym_id", gymId)

  if (deleteError) {
    return { success: false, error: deleteError.message }
  }

  revalidatePath("/admin/sessions")
  return { success: true }
}

export async function getSessionBookings(sessionId: string) {
  const { isAdmin, error } = await checkIsAdmin()
  if (!isAdmin) {
    return { success: false, error: error || "Not authorized", bookings: [] }
  }

  const supabase = await createAdminClient()

  const { data: bookings, error: fetchError } = await supabase
    .from("bookings")
    .select(`
      *,
      profiles:user_id (
        id,
        full_name,
        phone
      )
    `)
    .eq("session_id", sessionId)
    .eq("status", "confirmed")
    .order("booked_at", { ascending: true })

  if (fetchError) {
    return { success: false, error: fetchError.message, bookings: [] }
  }

  return { success: true, bookings: bookings || [] }
}

export async function cancelBookingAsAdmin(bookingId: string, refundToken = true) {
  const { isAdmin, error } = await checkIsAdmin()
  if (!isAdmin) {
    return { success: false, error: error || "Not authorized" }
  }

  const supabase = await createAdminClient()

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("*, gym_sessions(*)")
    .eq("id", bookingId)
    .single()

  if (bookingError || !booking) {
    return { success: false, error: "Booking not found" }
  }

  const { error: updateError } = await supabase
    .from("bookings")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", bookingId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  const { error: sessionError } = await supabase
    .from("gym_sessions")
    .update({ available_slots: (booking.gym_sessions?.available_slots || 0) + 1 })
    .eq("id", booking.session_id)

  if (sessionError) {
    return { success: false, error: sessionError.message }
  }

  if (refundToken) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("workout_tokens")
      .eq("id", booking.user_id)
      .single()

    if (profile) {
      await supabase
        .from("profiles")
        .update({ workout_tokens: profile.workout_tokens + 1 })
        .eq("id", booking.user_id)
    }
  }

  await supabase.from("notifications").insert({
    user_id: booking.user_id,
    title: "Booking Cancelled",
    message: `Your booking for ${new Date(booking.gym_sessions?.session_date).toLocaleDateString()} at ${booking.gym_sessions?.start_time?.slice(0, 5)} has been cancelled by admin.${refundToken ? " Your token has been refunded." : ""}`,
    type: "booking_cancelled",
  })

  revalidatePath("/admin/sessions")
  return { success: true }
}

export async function sendMessageToBookers(sessionId: string, title: string, message: string) {
  const { isAdmin, error } = await checkIsAdmin()
  if (!isAdmin) {
    return { success: false, error: error || "Not authorized" }
  }

  const supabase = await createAdminClient()

  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("user_id")
    .eq("session_id", sessionId)
    .eq("status", "confirmed")

  if (bookingsError) {
    return { success: false, error: bookingsError.message }
  }

  if (!bookings || bookings.length === 0) {
    return { success: false, error: "No bookers found for this session" }
  }

  const notifications = bookings.map((booking) => ({
    user_id: booking.user_id,
    title,
    message,
    type: "admin_message",
  }))

  const { error: notifError } = await supabase.from("notifications").insert(notifications)

  if (notifError) {
    return { success: false, error: notifError.message }
  }

  return { success: true, count: bookings.length }
}

export async function cancelAllSessionBookings(sessionId: string, refundTokens = true) {
  const { isAdmin, error } = await checkIsAdmin()
  if (!isAdmin) {
    return { success: false, error: error || "Not authorized" }
  }

  const supabase = await createAdminClient()

  const { data: session } = await supabase.from("gym_sessions").select("*").eq("id", sessionId).single()

  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("*")
    .eq("session_id", sessionId)
    .eq("status", "confirmed")

  if (bookingsError) {
    return { success: false, error: bookingsError.message }
  }

  if (!bookings || bookings.length === 0) {
    return { success: true, count: 0 }
  }

  const { error: updateError } = await supabase
    .from("bookings")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("session_id", sessionId)
    .eq("status", "confirmed")

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  if (session) {
    await supabase.from("gym_sessions").update({ available_slots: session.total_slots }).eq("id", sessionId)
  }

  for (const booking of bookings) {
    if (refundTokens) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("workout_tokens")
        .eq("id", booking.user_id)
        .single()

      if (profile) {
        await supabase
          .from("profiles")
          .update({ workout_tokens: profile.workout_tokens + 1 })
          .eq("id", booking.user_id)
      }
    }

    await supabase.from("notifications").insert({
      user_id: booking.user_id,
      title: "Booking Cancelled",
      message: `Your booking for ${session ? new Date(session.session_date).toLocaleDateString() : "this session"} has been cancelled by admin.${refundTokens ? " Your token has been refunded." : ""}`,
      type: "booking_cancelled",
    })
  }

  revalidatePath("/admin/sessions")
  return { success: true, count: bookings.length }
}

export async function updateMemberTokens(memberId: string, tokens: number) {
  const { isAdmin, error } = await checkIsAdmin()
  if (!isAdmin) {
    return { success: false, error: error || "Not authorized" }
  }

  const supabase = await createAdminClient()

  const { error: updateError } = await supabase.from("profiles").update({ workout_tokens: tokens }).eq("id", memberId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  revalidatePath("/admin/members")
  return { success: true }
}

export async function updateMemberSubscription(
  memberId: string,
  data: {
    subscription_plan?: string
    subscription_status?: string
    tokens_per_period?: number
    subscription_start_date?: string
    subscription_end_date?: string
  },
) {
  const { isAdmin, error } = await checkIsAdmin()
  if (!isAdmin) {
    return { success: false, error: error || "Not authorized" }
  }

  const supabase = await createAdminClient()

  if (data.subscription_plan) {
    // Get the subscription plan details
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("name", data.subscription_plan)
      .single()

    if (planError || !plan) {
      return { success: false, error: "Subscription plan not found" }
    }

    // Calculate dates
    const startDate = data.subscription_start_date || new Date().toISOString().split("T")[0]
    const endDate =
      data.subscription_end_date ||
      new Date(Date.now() + plan.duration_days * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", memberId)
      .eq("status", "active")
      .single()

    if (existingSubscription) {
      // Update existing subscription
      const { error: updateSubError } = await supabase
        .from("user_subscriptions")
        .update({
          plan_id: plan.id,
          plan_name: plan.name,
          plan_price: plan.price,
          total_trainings: plan.training_count,
          remaining_trainings: plan.training_count,
          start_date: startDate,
          end_date: endDate,
          status: data.subscription_status || "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSubscription.id)

      if (updateSubError) {
        return { success: false, error: updateSubError.message }
      }
    } else {
      // Create new subscription record
      const { error: insertError } = await supabase.from("user_subscriptions").insert({
        user_id: memberId,
        plan_id: plan.id,
        plan_name: plan.name,
        plan_price: plan.price,
        total_trainings: plan.training_count,
        remaining_trainings: plan.training_count,
        start_date: startDate,
        end_date: endDate,
        status: data.subscription_status || "active",
      })

      if (insertError) {
        return { success: false, error: insertError.message }
      }
    }

    // Update workout tokens in profiles to match the plan
    const { error: tokenError } = await supabase
      .from("profiles")
      .update({
        workout_tokens: plan.training_count,
        subscription_plan: plan.name,
        subscription_status: data.subscription_status || "active",
        subscription_start_date: startDate,
        subscription_end_date: endDate,
        tokens_per_period: plan.training_count,
      })
      .eq("id", memberId)

    if (tokenError) {
      return { success: false, error: tokenError.message }
    }
  } else {
    // Just update profile fields
    const { error: updateError } = await supabase.from("profiles").update(data).eq("id", memberId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }
  }

  revalidatePath("/admin/members")
  return { success: true }
}

export async function createAdminMessage(data: { title: string; message: string; expires_at?: string | null }) {
  const { isAdmin, error } = await checkIsAdmin()
  if (!isAdmin) {
    return { success: false, error: error || "Not authorized" }
  }

  const supabase = await createClient()
  const adminClient = await createAdminClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error: insertError } = await adminClient.from("admin_messages").insert({
    ...data,
    created_by: user.id,
  })

  if (insertError) {
    return { success: false, error: insertError.message }
  }

  revalidatePath("/admin/messages")
  return { success: true }
}

export async function deleteAdminMessage(id: string) {
  const { isAdmin, error } = await checkIsAdmin()
  if (!isAdmin) {
    return { success: false, error: error || "Not authorized" }
  }

  const adminClient = await createAdminClient()

  const { error: deleteError } = await adminClient.from("admin_messages").delete().eq("id", id)

  if (deleteError) {
    return { success: false, error: deleteError.message }
  }

  revalidatePath("/admin/messages")
  return { success: true }
}

export async function createRecurringSessions(data: {
  session_date: string
  start_time: string
  end_time: string
  total_slots: number
  workout_duration_minutes?: number
  recurring: "daily" | "weekly"
  recurrence_count: number
}) {
  const { isAdmin, error } = await checkIsAdmin()
  if (!isAdmin) {
    return { success: false, error: error || "Not authorized" }
  }

  const supabase = await createClient()
  const adminClient = await createAdminClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const gymId = await getActiveGymId()
  if (!gymId) return { success: false, error: "No gym found" }

  const durationMinutes = data.workout_duration_minutes || 60
  const timeSlots = generateTimeSlots(data.start_time, data.end_time, durationMinutes)

  const sessions = []
  const startDate = new Date(data.session_date)

  for (let i = 0; i < data.recurrence_count; i++) {
    const sessionDate = new Date(startDate)

    if (data.recurring === "daily") {
      sessionDate.setDate(startDate.getDate() + i)
    } else if (data.recurring === "weekly") {
      sessionDate.setDate(startDate.getDate() + i * 7)
    }

    for (const slot of timeSlots) {
      sessions.push({
        session_date: sessionDate.toISOString().split("T")[0],
        start_time: slot.start,
        end_time: slot.end,
        total_slots: data.total_slots,
        available_slots: data.total_slots,
        created_by: user.id,
        gym_id: gymId,
        is_open: true,
      })
    }
  }

  const { error: insertError } = await adminClient.from("gym_sessions").insert(sessions)

  if (insertError) {
    return { success: false, error: insertError.message }
  }

  revalidatePath("/admin/sessions")
  return { success: true, count: sessions.length }
}

// Weekly schedule functions
export async function getWeeklySchedule() {
  const supabase = await createAdminClient()
  const gymId = await getActiveGymId()

  let query = supabase
    .from("weekly_schedule")
    .select("*")
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true })

  if (gymId) {
    query = query.eq("gym_id", gymId)
  }

  const { data, error } = await query

  if (error) {
    return { success: false, error: error.message, schedule: [] }
  }

  return { success: true, schedule: data || [] }
}

export async function saveWeeklyScheduleDay(data: {
  day_of_week: number
  start_time: string
  end_time: string
  total_slots: number
  workout_duration_minutes: number
  is_enabled: boolean
}) {
  const { isAdmin, error } = await checkIsAdmin()
  if (!isAdmin) {
    return { success: false, error: error || "Not authorized" }
  }

  const supabase = await createAdminClient()

  const { data: existing } = await supabase
    .from("weekly_schedule")
    .select("id")
    .eq("day_of_week", data.day_of_week)
    .single()

  if (existing) {
    const { error: updateError } = await supabase
      .from("weekly_schedule")
      .update({
        start_time: data.start_time,
        end_time: data.end_time,
        total_slots: data.total_slots,
        workout_duration_minutes: data.workout_duration_minutes,
        is_enabled: data.is_enabled,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)

    if (updateError) {
      return { success: false, error: updateError.message }
    }
  } else {
    const gymId = await getActiveGymId()
    const { error: insertError } = await supabase.from("weekly_schedule").insert({
      day_of_week: data.day_of_week,
      start_time: data.start_time,
      end_time: data.end_time,
      total_slots: data.total_slots,
      workout_duration_minutes: data.workout_duration_minutes,
      is_enabled: data.is_enabled,
      ...(gymId ? { gym_id: gymId } : {}),
    })

    if (insertError) {
      return { success: false, error: insertError.message }
    }
  }

  revalidatePath("/admin/sessions")
  return { success: true }
}

export async function toggleWeeklyScheduleDay(dayOfWeek: number, isEnabled: boolean) {
  const { isAdmin, error } = await checkIsAdmin()
  if (!isAdmin) {
    return { success: false, error: error || "Not authorized" }
  }

  const supabase = await createAdminClient()

  const { error: updateError } = await supabase
    .from("weekly_schedule")
    .update({ is_enabled: isEnabled, updated_at: new Date().toISOString() })
    .eq("day_of_week", dayOfWeek)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  revalidatePath("/admin/sessions")
  return { success: true }
}

export async function deleteWeeklyScheduleDay(dayOfWeek: number) {
  const { isAdmin, error } = await checkIsAdmin()
  if (!isAdmin) {
    return { success: false, error: error || "Not authorized" }
  }

  const supabase = await createAdminClient()

  const { error: deleteError } = await supabase.from("weekly_schedule").delete().eq("day_of_week", dayOfWeek)

  if (deleteError) {
    return { success: false, error: deleteError.message }
  }

  revalidatePath("/admin/sessions")
  return { success: true }
}

export async function applyWeeklySchedule(weeksAhead = 4) {
  const { isAdmin, error } = await checkIsAdmin()
  if (!isAdmin) {
    return { success: false, error: error || "Not authorized" }
  }

  const supabase = await createClient()
  const adminClient = await createAdminClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: schedule, error: scheduleError } = await adminClient
    .from("weekly_schedule")
    .select("*")
    .eq("is_enabled", true)

  if (scheduleError) {
    return { success: false, error: scheduleError.message }
  }

  if (!schedule || schedule.length === 0) {
    return { success: false, error: "No weekly schedule configured" }
  }

  const startDate = new Date()
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + weeksAhead * 7)

  const { data: overrides } = await adminClient
    .from("schedule_overrides")
    .select("*")
    .gte("override_date", startDate.toISOString().split("T")[0])
    .lte("override_date", endDate.toISOString().split("T")[0])

  const overrideMap = new Map(overrides?.map((o) => [o.override_date, o]) || [])

  const sessions = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < weeksAhead * 7; i++) {
    const currentDate = new Date(today)
    currentDate.setDate(today.getDate() + i)
    const dayOfWeek = currentDate.getDay()
    const dateStr = currentDate.toISOString().split("T")[0]

    const override = overrideMap.get(dateStr)
    if (override?.is_closed) {
      continue
    }

    const daySchedule = schedule.find((s) => s.day_of_week === dayOfWeek)
    if (!daySchedule) {
      continue
    }

    const startTime = override?.start_time || daySchedule.start_time
    const endTime = override?.end_time || daySchedule.end_time
    const totalSlots = override?.total_slots || daySchedule.total_slots
    const durationMinutes = daySchedule.workout_duration_minutes

    const slots = generateTimeSlots(startTime.slice(0, 5), endTime.slice(0, 5), durationMinutes)

    const gymId = await getActiveGymId()
    for (const slot of slots) {
      sessions.push({
        session_date: dateStr,
        start_time: slot.start,
        end_time: slot.end,
        total_slots: totalSlots,
        available_slots: totalSlots,
        created_by: user.id,
        gym_id: gymId!,
        is_open: true,
      })
    }
  }

  if (sessions.length === 0) {
    return { success: false, error: "No sessions to create" }
  }

  const applyGymId = await getActiveGymId()
  let deleteQuery = adminClient
    .from("gym_sessions")
    .delete()
    .gte("session_date", today.toISOString().split("T")[0])

  if (applyGymId) {
    deleteQuery = deleteQuery.eq("gym_id", applyGymId)
  }

  const { error: deleteError } = await deleteQuery

  if (deleteError) {
    return { success: false, error: deleteError.message }
  }

  const { error: insertError } = await adminClient.from("gym_sessions").insert(sessions)

  if (insertError) {
    return { success: false, error: insertError.message }
  }

  revalidatePath("/admin/sessions")
  return { success: true, count: sessions.length }
}

export async function getScheduleOverrides() {
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from("schedule_overrides")
    .select("*")
    .gte("override_date", new Date().toISOString().split("T")[0])
    .order("override_date", { ascending: true })

  if (error) {
    return { success: false, error: error.message, overrides: [] }
  }

  return { success: true, overrides: data || [] }
}

export async function createScheduleOverride(data: {
  override_date: string
  is_closed: boolean
  start_time?: string | null
  end_time?: string | null
  total_slots?: number | null
  reason?: string | null
}) {
  const { isAdmin, error } = await checkIsAdmin()
  if (!isAdmin) {
    return { success: false, error: error || "Not authorized" }
  }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from("schedule_overrides")
    .select("id")
    .eq("override_date", data.override_date)
    .single()

  if (existing) {
    const { error: updateError } = await supabase
      .from("schedule_overrides")
      .update({
        is_closed: data.is_closed,
        start_time: data.start_time,
        end_time: data.end_time,
        total_slots: data.total_slots,
        reason: data.reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)

    if (updateError) {
      return { success: false, error: updateError.message }
    }
  } else {
    const { error: insertError } = await supabase.from("schedule_overrides").insert(data)

    if (insertError) {
      return { success: false, error: insertError.message }
    }
  }

  revalidatePath("/admin/sessions")
  return { success: true }
}

export async function deleteScheduleOverride(id: string) {
  const { isAdmin, error } = await checkIsAdmin()
  if (!isAdmin) {
    return { success: false, error: error || "Not authorized" }
  }

  const supabase = await createClient()

  const { error: deleteError } = await supabase.from("schedule_overrides").delete().eq("id", id)

  if (deleteError) {
    return { success: false, error: deleteError.message }
  }

  revalidatePath("/admin/sessions")
  return { success: true }
}

function generateTimeSlots(
  startTime: string,
  endTime: string,
  durationMinutes: number,
): { start: string; end: string }[] {
  const slots: { start: string; end: string }[] = []

  const [startHour, startMinute] = startTime.split(":").map(Number)
  const [endHour, endMinute] = endTime.split(":").map(Number)

  const startMinutes = startHour * 60 + startMinute
  const endMinutes = endHour * 60 + endMinute

  for (let current = startMinutes; current + durationMinutes <= endMinutes; current += durationMinutes) {
    const slotStartHour = Math.floor(current / 60)
    const slotStartMinute = current % 60
    const slotEndMinutes = current + durationMinutes
    const slotEndHour = Math.floor(slotEndMinutes / 60)
    const slotEndMinute = slotEndMinutes % 60

    slots.push({
      start: `${String(slotStartHour).padStart(2, "0")}:${String(slotStartMinute).padStart(2, "0")}:00`,
      end: `${String(slotEndHour).padStart(2, "0")}:${String(slotEndMinute).padStart(2, "0")}:00`,
    })
  }

  return slots
}

export async function getCurrentUserGym() {
  const { isAdmin, error } = await checkIsAdmin()
  if (!isAdmin) {
    return { success: false, error: error || "Not authorized", gym: null }
  }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated", gym: null }
  const adminClient = await createAdminClient()

  // Check for active gym cookie
  const cookieStore = await cookies()
  const activeGymId = cookieStore.get("active_gym_id")?.value

  if (activeGymId) {
    const { data: gym, error: gymError } = await adminClient
      .from("gyms")
      .select("id, name, slug, logo_url, email, phone, address, city, state, zip_code, country")
      .eq("id", activeGymId)
      .eq("owner_id", user.id)
      .single()
    if (gym) return { success: true, gym }
  }

  // Fallback to most recent gym
  const { data: gym, error: gymError } = await adminClient
    .from("gyms")
    .select("id, name, slug, logo_url, email, phone, address, city, state, zip_code, country")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (gymError) return { success: false, error: gymError.message, gym: null }
  return { success: true, gym }
}

export async function switchGym(gymId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  // Verify ownership
  const adminClient = await createAdminClient()
  const { data: gym } = await adminClient
    .from("gyms")
    .select("id")
    .eq("id", gymId)
    .eq("owner_id", user.id)
    .single()
  if (!gym) return { success: false, error: "Not authorized" }

  const cookieStore = await cookies()
  cookieStore.set("active_gym_id", gymId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  })

  revalidatePath("/admin", "layout")
  return { success: true }
}

export async function updateGymSettings(
  gymId: string,
  data: {
    name?: string
    slug?: string
    logo_url?: string
    address?: string
    city?: string
    state?: string
    zip_code?: string
    country?: string
    phone?: string
    email?: string
  },
) {
  const { isAdmin, error } = await checkIsAdmin()
  if (!isAdmin) {
    return { success: false, error: error || "Not authorized" }
  }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }
  const adminClient = await createAdminClient()
  const { data: owned } = await adminClient.from("gyms").select("id").eq("id", gymId).eq("owner_id", user.id).single()
  if (!owned) {
    return { success: false, error: "Not authorized to update this gym" }
  }
  const { error: updateError } = await adminClient.from("gyms").update(data).eq("id", gymId)
  if (updateError) return { success: false, error: updateError.message }
  revalidatePath("/admin/settings")
  return { success: true }
}

export async function uploadGymLogo(gymId: string, formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
  const { isAdmin, error } = await checkIsAdmin()
  if (!isAdmin) return { success: false, error: error || "Not authorized" }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }
  const adminClient = await createAdminClient()
  const { data: owned } = await adminClient.from("gyms").select("id").eq("id", gymId).eq("owner_id", user.id).single()
  if (!owned) return { success: false, error: "Not authorized" }
  const file = formData.get("file") as File | null
  if (!file?.size) return { success: false, error: "No file provided" }
  const ext = file.name.split(".").pop() || "png"
  const path = `gym-logos/${gymId}/logo.${ext}`
  const { data: upload, error: uploadError } = await adminClient.storage.from("public").upload(path, file, { upsert: true })
  if (uploadError) return { success: false, error: uploadError.message }
  const { data: urlData } = adminClient.storage.from("public").getPublicUrl(upload.path)

  // Auto-update gym with new logo URL
  await adminClient
    .from("gyms")
    .update({ logo_url: urlData.publicUrl })
    .eq("id", gymId)

  revalidatePath("/admin", "layout")
  revalidatePath("/admin/settings")

  return { success: true, url: urlData.publicUrl }
}
