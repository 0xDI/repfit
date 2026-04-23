import { notFound } from "next/navigation"
import { getGymBySlug, getGymSessions, checkMembership } from "@/lib/actions/public-gym"
import { createClient } from "@/lib/supabase/server"
import { ensureProfileExists } from "@/lib/actions/profile"
import { getSessionsWithParticipants } from "@/lib/actions/sessions"
import { getUserBookings } from "@/lib/actions/bookings"
import GymPageClient from "@/components/gym-page-client"

// Reserved paths — same as layout
const RESERVED_PATHS = new Set([
    "admin", "dashboard", "auth", "onboarding", "api", "gym", "explore",
    "settings", "login", "signup", "register", "profile",
    "account", "billing", "pricing", "about", "contact",
    "help", "support", "terms", "privacy", "test",
    "_next", "favicon.ico", "repfit-logo.png",
])

function getAthensDateString(): string {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Athens" })
}

export default async function GymPublicPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    if (RESERVED_PATHS.has(slug)) {
        notFound()
    }

    const { gym } = await getGymBySlug(slug)

    if (!gym) {
        notFound()
    }

    const { sessions } = await getGymSessions(gym.id)

    // Check if user is authenticated and a member
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let memberData = null

    if (user) {
        const membershipResult = await checkMembership(gym.id)

        if (membershipResult.isMember && membershipResult.isAuthenticated) {
            // Fetch full dashboard data for members
            const profileResult = await ensureProfileExists(user.id, user.email || "")
            const profile = profileResult.success ? profileResult.profile : null

            if (profile) {
                // Subscription data
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

                // Sessions with participants (for BookingCalendar)
                const today = getAthensDateString()
                const futureDate = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Athens" }))
                futureDate.setDate(futureDate.getDate() + 14)
                const futureDateString = futureDate.toISOString().split("T")[0]
                const { sessions: sessionsWithParticipants } = await getSessionsWithParticipants(today, futureDateString, gym.id)

                // User bookings
                const { bookings } = await getUserBookings(user.id)

                const isAdmin = profile.is_admin === true || profile.role === "admin"
                const hasNoSubscription = !subscriptionData || subscriptionData.remaining_trainings <= 0
                const totalTokens = subscriptionData?.remaining_trainings || profile.workout_tokens || 0

                // Calculate stats
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
                    .sort((a, b) => new Date(b.gym_sessions!.session_date).getTime() - new Date(a.gym_sessions!.session_date).getTime())

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
                        const todayDate = new Date(now)
                        todayDate.setHours(0, 0, 0, 0)

                        if (bookingDate.getTime() === todayDate.getTime() || bookingDate.getTime() === yesterday.getTime()) {
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

                // Weekly activity
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

                memberData = {
                    profile,
                    isAdmin,
                    subscriptionData,
                    sessionsWithParticipants,
                    bookings,
                    hasNoSubscription,
                    totalTokens,
                    stats: {
                        upcomingBookings: upcomingBookings.length,
                        completedThisMonth: completedThisMonth.length,
                        currentStreak,
                        longestStreak,
                        weeklyActivity,
                    },
                }
            }
        }
    }

    return <GymPageClient gym={gym} initialSessions={sessions} memberData={memberData} />
}
