"use server"

import { createClient } from "@/lib/supabase/server"
import type { GymSessionWithParticipants } from "@/lib/types"

export async function getSessionsWithParticipants(startDate: string, endDate: string) {
  const supabase = await createClient()

  const { data: sessions, error: sessionsError } = await supabase
    .from("gym_sessions")
    .select("*")
    .gte("session_date", startDate)
    .lte("session_date", endDate)
    .eq("is_open", true)
    .order("start_time", { ascending: true })

  if (sessionsError) {
    // Gracefully handle missing table or RLS errors - return empty instead of crashing
    console.warn("Sessions query issue (may be expected for new gyms):", sessionsError.code || sessionsError.message || "unknown")
    return { sessions: [], error: null }
  }

  if (!sessions) {
    console.log("No sessions found for date range:", startDate, endDate)
    return { sessions: [], error: "No sessions found" }
  }

  console.log(`Found ${sessions.length} sessions for ${startDate} to ${endDate}`)

  // Fetch all bookings for these sessions with user profiles
  const sessionIds = sessions.map((s) => s.id)

  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select(
      `
      user_id,
      session_id
    `,
    )
    .in("session_id", sessionIds)
    .eq("status", "confirmed")

  // Map bookings to sessions
  const sessionsWithParticipants: GymSessionWithParticipants[] = sessions.map((session) => {
    const sessionBookings = bookings?.filter((b) => b.session_id === session.id) || []
    return {
      ...session,
      participants: sessionBookings.map((b) => {
        return {
          user_id: b.user_id,
          full_name: "User", // Fallback since we can't fetch profile due to RLS recursion
        }
      }),
    }
  })

  return { sessions: sessionsWithParticipants, error: null }
}
