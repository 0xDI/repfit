"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"

export interface PublicGymData {
    id: string
    name: string
    slug: string
    description: string | null
    logo_url: string | null
    email: string | null
    phone: string | null
    address: string | null
    city: string | null
    state: string | null
    zip_code: string | null
    country: string | null
    is_active: boolean
}

export interface PublicSession {
    id: string
    session_date: string
    start_time: string
    end_time: string
    total_slots: number
    available_slots: number
    workout_duration_minutes?: number
}

// Fetch gym by slug — public, no auth needed
export async function getGymBySlug(slug: string) {
    const admin = await createAdminClient()

    const { data: gym, error } = await admin
        .from("gyms")
        .select("id, name, slug, description, logo_url, email, phone, address, city, state, zip_code, country, is_active")
        .eq("slug", slug)
        .maybeSingle()

    if (error || !gym) {
        return { gym: null, error: error?.message || "Gym not found" }
    }

    return { gym: gym as PublicGymData, error: null }
}

// Fetch upcoming sessions for a gym — public
export async function getGymSessions(gymId: string) {
    const admin = await createAdminClient()

    const today = new Date().toISOString().split("T")[0]
    const weekLater = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]

    // For now, fetch sessions without gym_id filter since gym_sessions
    // doesn't have a gym_id column yet. We'll return all open sessions.
    const { data: sessions, error } = await admin
        .from("gym_sessions")
        .select("id, session_date, start_time, end_time, total_slots, available_slots, workout_duration_minutes")
        .gte("session_date", today)
        .lte("session_date", weekLater)
        .eq("is_open", true)
        .order("session_date", { ascending: true })
        .order("start_time", { ascending: true })

    if (error) {
        return { sessions: [], error: error.message }
    }

    return { sessions: (sessions || []) as PublicSession[], error: null }
}

// Check if the current user is a member of a gym
export async function checkMembership(gymId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { isMember: false, isAuthenticated: false }
    }

    const admin = await createAdminClient()
    const { data: membership } = await admin
        .from("gym_members")
        .select("id, role, status")
        .eq("gym_id", gymId)
        .eq("user_id", user.id)
        .maybeSingle()

    return {
        isMember: !!membership && membership.status === "active",
        isAuthenticated: true,
        role: membership?.role || null,
        userId: user.id,
    }
}

// Join a gym as a member
export async function joinGym(gymId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Please log in first" }
    }

    const admin = await createAdminClient()

    // Check not already a member
    const { data: existing } = await admin
        .from("gym_members")
        .select("id")
        .eq("gym_id", gymId)
        .eq("user_id", user.id)
        .maybeSingle()

    if (existing) {
        return { error: "You're already a member of this gym" }
    }

    const { error } = await admin
        .from("gym_members")
        .insert({
            gym_id: gymId,
            user_id: user.id,
            role: "member",
            status: "active",
        })

    if (error) {
        console.error("Failed to join gym:", error)
        return { error: error.message }
    }

    return { success: true }
}

// Book a session (requires membership)
export async function bookPublicSession(gymId: string, sessionId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Please log in first" }
    }

    const admin = await createAdminClient()

    // Verify membership
    const { data: membership } = await admin
        .from("gym_members")
        .select("id")
        .eq("gym_id", gymId)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle()

    if (!membership) {
        return { error: "You must join this gym first" }
    }

    // Check session availability
    const { data: session } = await admin
        .from("gym_sessions")
        .select("id, available_slots")
        .eq("id", sessionId)
        .eq("is_open", true)
        .single()

    if (!session) {
        return { error: "Session not found or is closed" }
    }

    if (session.available_slots <= 0) {
        return { error: "This session is fully booked" }
    }

    // Check not already booked
    const { data: existingBooking } = await admin
        .from("bookings")
        .select("id")
        .eq("user_id", user.id)
        .eq("session_id", sessionId)
        .eq("status", "confirmed")
        .maybeSingle()

    if (existingBooking) {
        return { error: "You've already booked this session" }
    }

    // Create booking
    const { error: bookingError } = await admin
        .from("bookings")
        .insert({
            user_id: user.id,
            session_id: sessionId,
            status: "confirmed",
        })

    if (bookingError) {
        console.error("Booking error:", bookingError)
        return { error: bookingError.message }
    }

    // Decrement available slots
    await admin
        .from("gym_sessions")
        .update({ available_slots: session.available_slots - 1 })
        .eq("id", sessionId)

    return { success: true }
}

// Search gyms by name or city — public
export async function searchGyms(query?: string) {
    const admin = await createAdminClient()

    let builder = admin
        .from("gyms")
        .select("id, name, slug, city, state, logo_url")
        .eq("is_active", true)
        .not("slug", "is", null)
        .order("name", { ascending: true })
        .limit(20)

    if (query && query.trim().length > 0) {
        const q = `%${query.trim()}%`
        builder = builder.or(`name.ilike.${q},city.ilike.${q}`)
    }

    const { data: gyms, error } = await builder

    if (error) {
        return { gyms: [], error: error.message }
    }

    return { gyms: gyms || [], error: null }
}
