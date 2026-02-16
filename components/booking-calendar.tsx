"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, ChevronDown, ChevronUp } from "lucide-react"
import type { GymSessionWithParticipants } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { createBooking } from "@/lib/actions/bookings"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/i18n/language-context"
import { getAthensNow, hasSessionStarted, formatAthensDate } from "@/lib/utils/timezone"
import { ParticipantAvatars } from "@/components/participant-avatars"

interface BookingCalendarProps {
  sessions: GymSessionWithParticipants[]
  userTokens: number
  hasActiveSubscription: boolean
}

export function BookingCalendar({ sessions, userTokens, hasActiveSubscription }: BookingCalendarProps) {
  const athensNow = getAthensNow()
  const [selectedDate, setSelectedDate] = useState<Date>(athensNow)
  const { toast } = useToast()
  const router = useRouter()
  const [isBooking, setIsBooking] = useState(false)
  const [showPastSessions, setShowPastSessions] = useState(false)
  const { t, language } = useLanguage()
  const hasAutoSelected = useRef(false)

  const today = new Date(athensNow.getFullYear(), athensNow.getMonth(), athensNow.getDate())

  const weekDays = Array.from({ length: 14 }, (_, i) => {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    return date
  })

  useEffect(() => {
    if (hasAutoSelected.current) return
    hasAutoSelected.current = true

    const todayString = formatAthensDate(today)
    const sessionsForToday = sessions.filter((s) => s.session_date === todayString && s.is_open)
    const upcomingForToday = sessionsForToday.filter(
      (session) => !hasSessionStarted(session.session_date, session.start_time),
    )

    console.log("[v0] Auto-select check - Today:", todayString)
    console.log("[v0] Sessions for today:", sessionsForToday.length)
    console.log("[v0] Upcoming for today:", upcomingForToday.length)

    // Only auto-jump if TODAY has no upcoming sessions
    if (upcomingForToday.length === 0) {
      for (let i = 1; i < weekDays.length; i++) {
        const nextDate = weekDays[i]
        const nextDateString = formatAthensDate(nextDate)
        const nextDaySessions = sessions.filter((s) => s.session_date === nextDateString && s.is_open)
        const nextDayUpcoming = nextDaySessions.filter(
          (session) => !hasSessionStarted(session.session_date, session.start_time),
        )

        if (nextDayUpcoming.length > 0) {
          console.log("[v0] Auto-selecting next available day:", nextDateString)
          setSelectedDate(nextDate)
          break
        }
      }
    }
  }, []) // Empty dependency array - only run once on mount

  const selectedDateString = formatAthensDate(selectedDate)
  const availableSessions = sessions.filter((s) => s.session_date === selectedDateString && s.is_open)

  console.log("[v0] Selected date:", selectedDateString)
  console.log("[v0] Available sessions for selected date:", availableSessions.length)

  const pastSessions = availableSessions.filter((session) =>
    hasSessionStarted(session.session_date, session.start_time),
  )
  const upcomingSessions = availableSessions.filter(
    (session) => !hasSessionStarted(session.session_date, session.start_time),
  )

  const handleBook = async (sessionId: string) => {
    setIsBooking(true)
    const result = await createBooking(sessionId)

    if (result.success) {
      toast({
        title: t("bookingConfirmed"),
        description: t("bookingConfirmedDesc"),
      })
      router.refresh()
    } else {
      toast({
        title: t("bookingFailed"),
        description: result.error || t("bookingFailedDesc"),
        variant: "destructive",
      })
    }
    setIsBooking(false)
  }

  const renderSession = (session: GymSessionWithParticipants) => {
    const sessionHasStarted = hasSessionStarted(session.session_date, session.start_time)
    const isFull = session.available_slots === 0
    const occupancyPercentage = Math.round(
      ((session.total_slots - session.available_slots) / session.total_slots) * 100,
    )
    const bookedCount = session.participants?.length || 0

    return (
      <Card
        key={session.id}
        className={`overflow-hidden p-4 transition-all md:p-6 ${
          sessionHasStarted ? "opacity-50" : "hover:shadow-lg active:scale-[0.98]"
        }`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1 space-y-2 md:space-y-3">
            {/* Time */}
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <Clock className="h-4 w-4 shrink-0 text-primary md:h-5 md:w-5" />
              <span className="text-lg font-bold md:text-xl">
                {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}
              </span>
              {sessionHasStarted && (
                <Badge variant="secondary" className="shrink-0">
                  {t("sessionStarted")}
                </Badge>
              )}
            </div>

            {/* Capacity */}
            <div className="space-y-1.5 md:space-y-2">
              <div className="flex items-center justify-between gap-2 text-sm md:text-base">
                <div className="flex min-w-0 items-center gap-2">
                  <Users className="h-4 w-4 shrink-0 text-muted-foreground md:h-5 md:w-5" />
                  <span className="truncate font-medium">
                    {session.available_slots} {t("spotsAvailable")}
                  </span>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground md:text-sm">{occupancyPercentage}% full</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-secondary md:h-2">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${occupancyPercentage}%` }}
                />
              </div>
            </div>

            {/* Participant avatars display */}
            <div className="pt-1">
              {bookedCount > 0 ? (
                <ParticipantAvatars participants={session.participants || []} maxDisplay={3} />
              ) : occupancyPercentage > 0 ? (
                <span className="text-xs text-muted-foreground">
                  {session.total_slots - session.available_slots} booked
                </span>
              ) : null}
            </div>
          </div>

          {/* Book Button */}
          <div className="flex shrink-0 justify-end sm:ml-4">
            {sessionHasStarted || isFull ? (
              <Badge variant="secondary" className="px-4 py-2 md:px-6 md:py-3 md:text-base">
                {sessionHasStarted ? t("unavailable") : t("full")}
              </Badge>
            ) : (
              <Button
                onClick={() => handleBook(session.id)}
                disabled={isBooking}
                size="lg"
                className="h-12 rounded-full px-6 font-semibold shadow-lg md:h-14 md:px-8 md:text-base"
              >
                {t("book")}
              </Button>
            )}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div id="booking" className="w-full space-y-4 md:space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{t("availableSessions")}</h2>
        <p className="text-sm text-muted-foreground">{t("selectDateDesc")}</p>
      </div>

      <div className="relative">
        {!hasActiveSubscription && (
          <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm bg-background/30 rounded-2xl">
            <div className="bg-card p-6 rounded-xl shadow-lg border text-center max-w-sm mx-4">
              <h3 className="font-semibold text-lg mb-2">Subscription Required</h3>
              <p className="text-sm text-muted-foreground">You need an active subscription to book sessions</p>
            </div>
          </div>
        )}

        <div className={hasActiveSubscription ? "" : "pointer-events-none"}>
          <div className="w-full overflow-hidden">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide md:grid md:grid-cols-7 md:gap-3 lg:grid-cols-7">
              {weekDays.map((date) => {
                const isSelected = formatAthensDate(date) === selectedDateString
                const dayName = date.toLocaleDateString(language === "el" ? "el-GR" : "en-US", { weekday: "short" })
                const dayNum = date.getDate()

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className={`flex min-w-[60px] shrink-0 flex-col items-center gap-1 rounded-2xl px-4 py-3 transition-all md:min-w-0 ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-lg"
                        : "bg-secondary text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    <span className="text-xs font-medium opacity-70">{dayName}</span>
                    <span className="text-2xl font-bold">{dayNum}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sessions List */}
          <div className="w-full space-y-3 md:space-y-4">
            {availableSessions.length === 0 ? (
              <Card className="flex flex-col items-center justify-center py-16 text-center md:py-24">
                <Clock className="mb-3 h-12 w-12 text-muted-foreground/30 md:h-16 md:w-16" />
                <p className="font-medium text-muted-foreground md:text-lg">{t("noSessionsAvailable")}</p>
              </Card>
            ) : (
              <>
                {pastSessions.length > 0 && (
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowPastSessions(!showPastSessions)}
                      className="flex w-full items-center justify-between rounded-xl bg-secondary/50 px-4 py-3 transition-colors hover:bg-secondary"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">
                          {pastSessions.length} {t("pastSessions")}
                        </span>
                      </div>
                      {showPastSessions ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>

                    {showPastSessions && (
                      <div className="space-y-3 md:space-y-4">
                        {pastSessions.map((session) => renderSession(session))}
                      </div>
                    )}
                  </div>
                )}

                {/* Upcoming sessions */}
                {upcomingSessions.length > 0 ? (
                  <div className="space-y-3 md:space-y-4">
                    {upcomingSessions.map((session) => renderSession(session))}
                  </div>
                ) : (
                  pastSessions.length > 0 && (
                    <Card className="flex flex-col items-center justify-center py-12 text-center">
                      <p className="text-sm text-muted-foreground">{t("noUpcomingSessionsToday")}</p>
                    </Card>
                  )
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
