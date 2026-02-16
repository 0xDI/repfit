import { redirect } from "next/navigation"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WorkoutChart } from "@/components/workout-chart"
import { Calendar, Clock, TrendingUp, Zap } from "lucide-react"

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const adminClient = await createAdminClient()
  const { data: profile } = await adminClient.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/auth/login")
  }

  // Get all user bookings
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, gym_sessions(*)")
    .eq("user_id", user.id)
    .eq("status", "confirmed")
    .order("created_at", { ascending: true })

  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false)

  // Calculate statistics
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const thisMonthCount =
    bookings?.filter((b) => {
      if (!b.gym_sessions) return false
      const sessionDate = new Date(b.gym_sessions.session_date)
      return sessionDate >= firstDayOfMonth
    }).length || 0

  const lastMonthCount =
    bookings?.filter((b) => {
      if (!b.gym_sessions) return false
      const sessionDate = new Date(b.gym_sessions.session_date)
      return sessionDate >= firstDayOfLastMonth && sessionDate <= lastDayOfLastMonth
    }).length || 0

  const totalWorkouts = bookings?.length || 0
  const averagePerMonth = totalWorkouts > 0 ? Math.round(totalWorkouts / 12) : 0

  // Group by month for chart
  const monthlyData: Record<string, number> = {}
  bookings?.forEach((booking) => {
    if (!booking.gym_sessions) return
    const date = new Date(booking.gym_sessions.session_date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1
  })

  const chartData = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, count]) => ({
      month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      workouts: count,
    }))

  const percentChange = lastMonthCount > 0 ? Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100) : 0

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-7xl space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Track your workout progress and statistics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{thisMonthCount}</div>
              <p className="text-xs text-muted-foreground">
                {percentChange > 0 ? "+" : ""}
                {percentChange}% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalWorkouts}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Average / Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{averagePerMonth}</div>
              <p className="text-xs text-muted-foreground">Based on last 12 months</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-gradient-to-br from-orange-500/10 to-red-600/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Workout Streak</CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{thisMonthCount > 0 ? "Active" : "0"}</div>
              <p className="text-xs text-muted-foreground">Keep it up!</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <WorkoutChart data={chartData} />

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest workout sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {!bookings || bookings.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">No workouts yet</p>
            ) : (
              <div className="space-y-3">
                {bookings.slice(0, 10).map((booking) => {
                  if (!booking.gym_sessions) return null
                  return (
                    <div key={booking.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">
                          {new Date(booking.gym_sessions.session_date).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">{booking.gym_sessions.start_time.slice(0, 5)}</p>
                      </div>
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
