import { createClient, createAdminClient } from "@/lib/supabase/server"
import { AdminOverview } from "@/components/admin-overview"
import { cookies } from "next/headers"

export default async function AdminPage() {
  const supabase = await createClient()

  // Get user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Use admin client for data fetching to bypass RLS policies
  const adminClient = await createAdminClient()

  // Get owned gyms to determine active gym
  const { data: ownedGyms } = await adminClient
    .from("gyms")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })

  const cookieStore = await cookies()
  const activeGymCookie = cookieStore.get("active_gym_id")?.value
  const activeGym = (activeGymCookie && ownedGyms?.find(g => g.id === activeGymCookie)) || ownedGyms?.[0] || null

  if (!activeGym) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2 border-b border-border/40 pb-6">
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">Dashboard</h1>
          <p className="text-sm font-medium text-muted-foreground">Manage your gym sessions, members, and bookings from one central hub.</p>
        </div>
        <p className="text-muted-foreground">Please create a gym to view your dashboard.</p>
      </div>
    )
  }

  const gymId = activeGym.id
  const today = new Date().toISOString().split("T")[0]

  // Get upcoming sessions with bookings
  const { data: upcomingSessions } = await adminClient
    .from("gym_sessions")
    .select(
      `
      *,
      bookings (
        id,
        user_id,
        status,
        booked_at,
        profiles (
          id,
          full_name,
          phone
        )
      )
    `,
    )
    .eq("gym_id", gymId)
    .gte("session_date", today)
    .order("session_date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(20)

  // Get statistics
  const { count: totalMembers } = await adminClient
    .from("gym_members")
    .select("*", { count: "exact", head: true })
    .eq("gym_id", gymId)

  const { data: activeSubscriptions } = await adminClient
    .from("user_subscriptions")
    .select("id")
    .eq("gym_id", gymId)
    .eq("status", "active")

  const { count: todaySessions } = await adminClient
    .from("gym_sessions")
    .select("*", { count: "exact", head: true })
    .eq("gym_id", gymId)
    .eq("session_date", today)

  const { data: todayBookingsData } = await adminClient
    .from("bookings")
    .select("id, gym_sessions!inner(session_date, gym_id)")
    .eq("gym_sessions.gym_id", gymId)
    .eq("gym_sessions.session_date", today)
    .eq("status", "confirmed")

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 border-b border-border/40 pb-6">
        <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">Dashboard</h1>
        <p className="text-sm font-medium text-muted-foreground">Manage your gym sessions, members, and bookings from one central hub.</p>
      </div>

      <AdminOverview
        upcomingSessions={(upcomingSessions || []).filter(s => s && s.start_time)} // Filter out any corrupt sessions safely
        stats={{
          totalMembers: totalMembers || 0,
          activeSubscriptions: activeSubscriptions?.length || 0,
          todaySessions: todaySessions || 0,
          todayBookings: todayBookingsData?.length || 0,
        }}
      />
    </div>
  )
}
