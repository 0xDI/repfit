import { createClient, createAdminClient } from "@/lib/supabase/server"
import { AdminOverview } from "@/components/admin-overview"

export default async function AdminPage() {
  const supabase = await createClient()

  // Use admin client for data fetching to bypass RLS policies
  const adminClient = await createAdminClient()

  // Get upcoming sessions with bookings
  const today = new Date().toISOString().split("T")[0]
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
    .gte("session_date", today)
    .order("session_date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(20)

  // Get statistics
  const { count: totalMembers } = await adminClient.from("profiles").select("*", { count: "exact", head: true })

  const { data: activeSubscriptions } = await adminClient.from("user_subscriptions").select("id").eq("status", "active")

  const { count: todaySessions } = await adminClient
    .from("gym_sessions")
    .select("*", { count: "exact", head: true })
    .eq("session_date", today)

  const { data: todayBookingsData } = await adminClient
    .from("bookings")
    .select("id, gym_sessions!inner(session_date)")
    .eq("gym_sessions.session_date", today)
    .eq("status", "confirmed")

  return (
    <>
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground">Monitor upcoming sessions and manage bookings</p>
      </div>

      <AdminOverview
        upcomingSessions={upcomingSessions || []}
        stats={{
          totalMembers: totalMembers || 0,
          activeSubscriptions: activeSubscriptions?.length || 0,
          todaySessions: todaySessions || 0,
          todayBookings: todayBookingsData?.length || 0,
        }}
      />
    </>
  )
}
