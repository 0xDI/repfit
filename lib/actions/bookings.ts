"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { createNotification } from "./notifications"
import {
  sendBookingConfirmationEmail,
  sendBookingCancellationEmail,
  sendBookingRescheduledEmail,
} from "@/lib/email/resend"

export async function createBooking(sessionId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  if (!sessionId || typeof sessionId !== "string") {
    return { success: false, error: "Invalid session ID" }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, workout_tokens, subscription_status")
    .eq("id", user.id)
    .single()

  const { data: activeSubscription } = await supabase
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .gt("remaining_trainings", 0)
    .maybeSingle()

  const hasActiveSubscription = activeSubscription || (profile?.workout_tokens && profile.workout_tokens > 0)

  if (!hasActiveSubscription) {
    return { success: false, error: "You need an active subscription or tokens to book a session" }
  }

  const { data: existingBooking } = await supabase
    .from("bookings")
    .select("id")
    .eq("user_id", user.id)
    .eq("session_id", sessionId)
    .eq("status", "confirmed")
    .maybeSingle()

  if (existingBooking) {
    return { success: false, error: "You have already booked this session" }
  }

  const { data: session } = await supabase.from("gym_sessions").select("*").eq("id", sessionId).single()

  if (!session || session.available_slots <= 0) {
    return { success: false, error: "No available slots" }
  }

  const { error: bookingError } = await supabase.from("bookings").insert({
    user_id: user.id,
    session_id: sessionId,
    status: "confirmed",
  })

  if (bookingError) {
    if (bookingError.code === "23505") {
      return { success: false, error: "You have already booked this session" }
    }
    return { success: false, error: bookingError.message }
  }

  try {
    if (activeSubscription && activeSubscription.remaining_trainings > 0) {
      await supabase
        .from("user_subscriptions")
        .update({ remaining_trainings: activeSubscription.remaining_trainings - 1 })
        .eq("id", activeSubscription.id)
    } else if (profile?.workout_tokens && profile.workout_tokens > 0) {
      await supabase
        .from("profiles")
        .update({ workout_tokens: profile.workout_tokens - 1 })
        .eq("id", user.id)
    }
  } catch (subError) {
    console.error("[v0] Token/subscription decrement failed (non-critical):", subError)
  }

  const sessionDate = new Date(session.session_date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 4)

  await createNotification(
    user.id,
    "Booking Confirmed",
    `Your workout session on ${sessionDate} at ${session.start_time.slice(0, 5)} has been booked successfully.`,
    "success",
    expiresAt,
  )

  if (profile?.phone) {
    try {
      await sendBookingConfirmationEmail(
        profile.phone,
        profile.full_name || "Valued Customer",
        session.session_date,
        session.start_time.slice(0, 5),
        session.end_time.slice(0, 5),
      )
    } catch (emailError) {
      console.error("Failed to send booking confirmation email:", emailError)
    }
  }

  revalidatePath("/dashboard")
  return { success: true }
}

export async function cancelBooking(bookingId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  if (!bookingId || typeof bookingId !== "string") {
    return { success: false, error: "Invalid booking ID" }
  }

  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select(
      `
      *,
      gym_sessions (*)
    `,
    )
    .eq("id", bookingId)
    .eq("user_id", user.id)
    .single()

  if (fetchError || !booking) {
    return { success: false, error: "Booking not found" }
  }

  const session = booking.gym_sessions as any
  const sessionDateTime = new Date(`${session.session_date}T${session.start_time}`)
  const now = new Date()
  const hoursUntilSession = (sessionDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)

  const shouldRefundToken = hoursUntilSession > 5

  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .eq("user_id", user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  const { data: profile } = await supabase.from("profiles").select("full_name, phone").eq("id", user.id).single()

  const sessionDate = new Date(session.session_date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  await createNotification(
    user.id,
    "Booking Cancelled",
    `Your workout session on ${sessionDate} at ${session.start_time.slice(0, 5)} has been cancelled.${shouldRefundToken ? " Token refunded." : " No token refund (cancelled within 5 hours)."}`,
    "warning",
  )

  if (profile?.phone) {
    try {
      await sendBookingCancellationEmail(
        profile.phone,
        profile.full_name || "Valued Customer",
        session.session_date,
        session.start_time.slice(0, 5),
        shouldRefundToken,
      )
    } catch (emailError) {
      console.error("Failed to send cancellation email:", emailError)
    }
  }

  revalidatePath("/dashboard")
  return { success: true, tokenRefunded: shouldRefundToken }
}

export async function rescheduleBooking(bookingId: string, newSessionId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  if (!bookingId || typeof bookingId !== "string" || !newSessionId || typeof newSessionId !== "string") {
    return { success: false, error: "Invalid booking or session ID" }
  }

  // Get current booking
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select(
      `
      *,
      gym_sessions (*)
    `,
    )
    .eq("id", bookingId)
    .eq("user_id", user.id)
    .single()

  if (fetchError || !booking) {
    return { success: false, error: "Booking not found" }
  }

  const oldSession = booking.gym_sessions as any
  const sessionDateTime = new Date(`${oldSession.session_date}T${oldSession.start_time}`)
  const now = new Date()
  const hoursUntilSession = (sessionDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)

  // Check if more than 5 hours before session
  if (hoursUntilSession <= 5) {
    return { success: false, error: "Cannot reschedule within 5 hours of session" }
  }

  // Check if new session has available slots
  const { data: newSession } = await supabase.from("gym_sessions").select("*").eq("id", newSessionId).single()

  if (!newSession || newSession.available_slots <= 0) {
    return { success: false, error: "No available slots in new session" }
  }

  // Update booking to new session
  const { error } = await supabase
    .from("bookings")
    .update({ session_id: newSessionId })
    .eq("id", bookingId)
    .eq("user_id", user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  // Send notification and email for reschedule
  const { data: profile } = await supabase.from("profiles").select("full_name, phone").eq("id", user.id).single()

  const oldDate = new Date(oldSession.session_date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
  const newDate = new Date(newSession.session_date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  await createNotification(
    user.id,
    "Booking Rescheduled",
    `Your workout has been moved from ${oldDate} at ${oldSession.start_time.slice(0, 5)} to ${newDate} at ${newSession.start_time.slice(0, 5)}.`,
    "info",
  )

  if (profile?.phone) {
    try {
      await sendBookingRescheduledEmail(
        profile.phone,
        profile.full_name || "Valued Customer",
        oldSession.session_date,
        oldSession.start_time.slice(0, 5),
        newSession.session_date,
        newSession.start_time.slice(0, 5),
        newSession.end_time.slice(0, 5),
      )
    } catch (emailError) {
      console.error("Failed to send reschedule email:", emailError)
    }
  }

  revalidatePath("/dashboard")
  return { success: true }
}

export async function getUserBookings(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      *,
      gym_sessions (*)
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    return { success: false, error: error.message, bookings: [] }
  }

  return { success: true, bookings: data }
}
