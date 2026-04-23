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

  // Build a set of dates that have sessions for dot indicators
  const datesWithSessions = new Set<string>()
  sessions.forEach((s) => {
    if (s.is_open) datesWithSessions.add(s.session_date)
  })

  useEffect(() => {
    if (hasAutoSelected.current) return
    hasAutoSelected.current = true

    const todayString = formatAthensDate(today)
    const sessionsForToday = sessions.filter((s) => s.session_date === todayString && s.is_open)
    const upcomingForToday = sessionsForToday.filter(
      (session) => !hasSessionStarted(session.session_date, session.start_time),
    )

    if (upcomingForToday.length === 0) {
      for (let i = 1; i < weekDays.length; i++) {
        const nextDate = weekDays[i]
        const nextDateString = formatAthensDate(nextDate)
        const nextDaySessions = sessions.filter((s) => s.session_date === nextDateString && s.is_open)
        const nextDayUpcoming = nextDaySessions.filter(
          (session) => !hasSessionStarted(session.session_date, session.start_time),
        )

        if (nextDayUpcoming.length > 0) {
          setSelectedDate(nextDate)
          break
        }
      }
    }
  }, [])

  const selectedDateString = formatAthensDate(selectedDate)
  const availableSessions = sessions.filter((s) => s.session_date === selectedDateString && s.is_open)

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
        className={`overflow-hidden border-border/40 bg-card/50 backdrop-blur-sm p-4 md:p-6 ${sessionHasStarted ? "opacity-40" : "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.99]"
          } transition-all`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1 space-y-2 md:space-y-3">
            {/* Time */}
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <Clock className="h-4 w-4 shrink-0 text-primary md:h-5 md:w-5" />
              <span className="text-lg font-bold md:text-xl">
                {session.start_time.slice(0, 5)} – {session.end_time.slice(0, 5)}
              </span>
              {sessionHasStarted && (
                <Badge variant="secondary" className="shrink-0 text-[10px]">
                  {t("sessionStarted")}
                </Badge>
              )}
            </div>

            {/* Capacity */}
            <div className="space-y-1.5 md:space-y-2">
              <div className="flex items-center justify-between gap-2 text-sm md:text-base">
                <div className="flex min-w-0 items-center gap-2">
                  <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate font-medium">
                    {session.available_slots} {t("spotsAvailable")}
                  </span>
                </div>
                <span className="shrink-0 text-[11px] text-muted-foreground font-medium">{occupancyPercentage}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-secondary/60 md:h-2">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-orange-400 transition-all duration-500"
                  style={{ width: `${occupancyPercentage}%` }}
                />
              </div>
            </div>

            {/* Participant avatars display */}
            <div className="pt-0.5">
              {bookedCount > 0 ? (
                <ParticipantAvatars participants={session.participants || []} maxDisplay={3} />
              ) : occupancyPercentage > 0 ? (
                <span className="text-[11px] text-muted-foreground">
                  {session.total_slots - session.available_slots} booked
                </span>
              ) : null}
            </div>
          </div>

          {/* Book Button */}
          <div className="flex shrink-0 justify-end sm:ml-4">
            {sessionHasStarted || isFull ? (
              <Badge variant="secondary" className="px-4 py-2 md:px-5 md:py-2.5 text-xs font-medium">
                {sessionHasStarted ? t("unavailable") : t("full")}
              </Badge>
            ) : (
              <Button
                onClick={() => handleBook(session.id)}
                disabled={isBooking}
                size="lg"
                className="h-11 rounded-full px-6 font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 md:h-12 md:px-8 active:scale-95"
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
        <p className="text-sm text-muted-foreground mt-0.5">{t("selectDateDesc")}</p>
      </div>

      <div className="relative">
        {!hasActiveSubscription && (
          <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm bg-background/30 rounded-2xl">
            <div className="glass p-6 rounded-2xl shadow-2xl text-center max-w-sm mx-4">
              <h3 className="font-bold text-lg mb-2">Subscription Required</h3>
              <p className="text-sm text-muted-foreground">You need an active subscription to book sessions</p>
            </div>
          </div>
        )}

        <div className={hasActiveSubscription ? "" : "pointer-events-none"}>
          {/* Date Picker Strip */}
          <div className="w-full overflow-hidden">
            <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide md:grid md:grid-cols-7 md:gap-2 lg:grid-cols-7">
              {weekDays.map((date) => {
                const dateString = formatAthensDate(date)
                const isSelected = dateString === selectedDateString
                const hasSessions = datesWithSessions.has(dateString)
                const dayName = date.toLocaleDateString(language === "el" ? "el-GR" : "en-US", { weekday: "short" })
                const dayNum = date.getDate()

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className={`flex min-w-[56px] shrink-0 flex-col items-center gap-0.5 rounded-2xl px-3 py-2.5 transition-all md:min-w-0 active:scale-95 ${isSelected
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                        : "bg-card/50 border border-border/40 text-foreground hover:bg-card hover:border-border/60"
                      }`}
                  >
                    <span className="text-[10px] font-medium opacity-70">{dayName}</span>
                    <span className="text-xl font-bold leading-tight">{dayNum}</span>
                    {/* Session dot indicator */}
                    <div className="h-1.5">
                      {hasSessions && (
                        <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white/80" : "bg-primary/60"}`} />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sessions List */}
          <div className="w-full space-y-3 md:space-y-3">
            {availableSessions.length === 0 ? (
              <Card className="flex flex-col items-center justify-center py-16 text-center border-border/40 bg-card/30 md:py-20">
                <Clock className="mb-3 h-10 w-10 text-muted-foreground/20" />
                <p className="font-medium text-muted-foreground">{t("noSessionsAvailable")}</p>
              </Card>
            ) : (
              <>
                {pastSessions.length > 0 && (
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowPastSessions(!showPastSessions)}
                      className="flex w-full items-center justify-between rounded-xl bg-muted/30 border border-border/30 px-4 py-2.5 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">
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
                      <div className="space-y-3">
                        {pastSessions.map((session) => renderSession(session))}
                      </div>
                    )}
                  </div>
                )}

                {/* Upcoming sessions */}
                {upcomingSessions.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingSessions.map((session) => renderSession(session))}
                  </div>
                ) : (
                  pastSessions.length > 0 && (
                    <Card className="flex flex-col items-center justify-center py-12 text-center border-border/40 bg-card/30">
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
