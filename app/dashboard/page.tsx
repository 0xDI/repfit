import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { StatsCards } from "@/components/stats-cards"
import { BookingCalendar } from "@/components/booking-calendar"
import { MyBookings } from "@/components/my-bookings"
import { getUserBookings } from "@/lib/actions/bookings"
import { ensureProfileExists } from "@/lib/actions/profile"
import { getSessionsWithParticipants } from "@/lib/actions/sessions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info, AlertCircle, Phone } from "lucide-react"
import { UserInfoModal } from "@/components/user-info-modal"
import { NotificationBanner } from "@/components/notification-banner"

function getAthensDateString(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Athens" })
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  const profileResult = await ensureProfileExists(user.id, user.email || "")

  if (!profileResult.success || !profileResult.profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 md:p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Setup Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              There was an issue setting up your account. Please contact support or try logging in again.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">Error: {profileResult.error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const profile = profileResult.profile

  const isAdmin = profile.is_admin === true || profile.role === "admin"

  const needsProfileCompletion = !profile.full_name || !profile.age

  let subscriptionData = null

  const { data: userSubscription } = await supabase
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  if (userSubscription) {
    subscriptionData = userSubscription
  } else if (profile.workout_tokens > 0 || profile.subscription_status === "active") {
    subscriptionData = {
      remaining_trainings: profile.workout_tokens || 0,
      total_trainings: profile.tokens_per_period || profile.workout_tokens || 0,
      status: profile.subscription_status || "active",
      start_date: profile.subscription_start_date || new Date().toISOString(),
      end_date: profile.subscription_end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      plan_name: profile.subscription_plan || "Subscription",
      plan_price: null,
    }
  }

  const today = getAthensDateString()
  const futureDate = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Athens" }))
  futureDate.setDate(futureDate.getDate() + 14)
  const futureDateString = futureDate.toISOString().split("T")[0]

  const { sessions } = await getSessionsWithParticipants(today, futureDateString)

  const { bookings } = await getUserBookings(user.id)

  const { data: unreadNotifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_read", false)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("created_at", { ascending: false })
    .limit(1)

  const { data: adminMessages } = await supabase
    .from("admin_messages")
    .select("*")
    .eq("is_active", true)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("created_at", { ascending: false })
    .limit(3)

  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const upcomingBookings = bookings.filter((b) => {
    if (b.status !== "confirmed" || !b.gym_sessions) return false
    return new Date(b.gym_sessions.session_date) >= new Date(today)
  })
  const completedThisMonth = bookings.filter((b) => {
    if (!b.gym_sessions) return false
    const sessionDate = new Date(b.gym_sessions.session_date)
    return sessionDate >= firstDayOfMonth && sessionDate < now && b.status === "confirmed"
  })

  const completedBookings = bookings
    .filter((b) => b.status === "confirmed" && b.gym_sessions)
    .sort((a, b) => {
      const dateA = new Date(a.gym_sessions!.session_date)
      const dateB = new Date(b.gym_sessions!.session_date)
      return dateB.getTime() - dateA.getTime()
    })

  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0
  let lastDate: Date | null = null

  for (const booking of completedBookings) {
    const bookingDate = new Date(booking.gym_sessions!.session_date)
    bookingDate.setHours(0, 0, 0, 0)

    if (bookingDate > now) continue

    if (!lastDate) {
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      yesterday.setHours(0, 0, 0, 0)

      const today = new Date(now)
      today.setHours(0, 0, 0, 0)

      if (bookingDate.getTime() === today.getTime() || bookingDate.getTime() === yesterday.getTime()) {
        currentStreak = 1
        tempStreak = 1
        lastDate = bookingDate
      } else {
        break
      }
    } else {
      const dayDiff = Math.floor((lastDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24))

      if (dayDiff === 1) {
        currentStreak++
        tempStreak++
        lastDate = bookingDate
      } else if (dayDiff === 0) {
        continue
      } else {
        if (tempStreak > longestStreak) longestStreak = tempStreak
        tempStreak = 1
        lastDate = bookingDate
      }
    }
  }

  if (tempStreak > longestStreak) longestStreak = tempStreak
  if (currentStreak > longestStreak) longestStreak = currentStreak

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  const startOfWeek = getStartOfWeek(now)
  startOfWeek.setHours(0, 0, 0, 0)

  const weeklyActivity = [0, 0, 0, 0, 0, 0, 0]

  completedBookings.forEach((booking) => {
    const sessionDate = new Date(booking.gym_sessions!.session_date)
    sessionDate.setHours(0, 0, 0, 0)

    if (sessionDate >= startOfWeek) {
      const dayIndex = (sessionDate.getDay() + 6) % 7
      weeklyActivity[dayIndex]++
    }
  })

  const hasNoSubscription = !subscriptionData || subscriptionData.remaining_trainings <= 0

  const totalTokens = subscriptionData?.remaining_trainings || profile.workout_tokens || 0

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <UserInfoModal open={needsProfileCompletion} userEmail={user.email} />

      <main className="mx-auto w-full max-w-2xl space-y-4 p-4 md:max-w-7xl md:space-y-6 md:p-8">
          {unreadNotifications && unreadNotifications.length > 0 && (
            <NotificationBanner notifications={unreadNotifications} />
          )}

          {adminMessages && adminMessages.length > 0 && (
            <div className="space-y-3">
              {adminMessages.map((message) => (
                <Alert key={message.id} className="rounded-xl border-border/50 md:rounded-2xl">
                  <Info className="h-5 w-5" />
                  <AlertTitle className="text-base">{message.title}</AlertTitle>
                  <AlertDescription className="text-sm">{message.message}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          <div className="space-y-4 md:space-y-6">
            {hasNoSubscription && (
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="font-semibold text-primary">No Active Subscription</h3>
                        <p className="text-sm text-foreground/80 mt-1">
                          You need an active subscription plan to book sessions. Contact us to get started today!
                        </p>
                      </div>
                      <a
                        href="tel:+306937043559"
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
                      >
                        <Phone className="h-4 w-4" />
                        Call +30 693 704 3559
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <StatsCards
              workoutTokens={totalTokens}
              totalBookings={bookings.length}
              upcomingBookings={upcomingBookings.length}
              completedThisMonth={completedThisMonth.length}
              currentStreak={currentStreak}
              longestStreak={longestStreak}
              weeklyActivity={weeklyActivity}
              subscriptionEndDate={subscriptionData?.end_date}
            />

            <div className="grid w-full gap-4 md:gap-6 lg:grid-cols-2">
              <div id="booking" className="min-w-0">
                <BookingCalendar
                  sessions={sessions || []}
                  userTokens={profile.workout_tokens}
                  hasActiveSubscription={!hasNoSubscription}
                />
              </div>

              <div className="min-w-0">
                <MyBookings bookings={bookings} isAdmin={isAdmin} />
              </div>
            </div>
          </div>
        </main>
    </div>
  )
}
