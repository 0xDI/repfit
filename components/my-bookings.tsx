"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, X, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react"
import type { Booking } from "@/lib/types"
import { cancelBooking } from "@/lib/actions/bookings"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useLanguage } from "@/lib/i18n/language-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { isSessionPast, getHoursUntilSession } from "@/lib/utils/timezone"
import { ParticipantAvatars } from "@/components/participant-avatars"
import { createClient } from "@/lib/supabase/client"

interface MyBookingsProps {
  bookings: Booking[]
  isAdmin?: boolean // Added isAdmin prop
}

interface BookingWithParticipants extends Booking {
  participants?: Array<{
    user_id: string
    full_name: string | null
  }>
}

export function MyBookings({ bookings, isAdmin = false }: MyBookingsProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null)
  const [isLateCancel, setIsLateCancel] = useState(false)
  const [showPastBookings, setShowPastBookings] = useState(false)
  const { t, language } = useLanguage()
  const [bookingsWithParticipants, setBookingsWithParticipants] = useState<BookingWithParticipants[]>([])

  useEffect(() => {
    async function fetchParticipants() {
      const supabase = createClient()
      const sessionIds = bookings.map((b) => b.session_id).filter(Boolean)

      if (sessionIds.length === 0) {
        setBookingsWithParticipants(bookings)
        return
      }

      const { data: allBookings } = await supabase
        .from("bookings")
        .select(
          `
          user_id,
          session_id,
          profiles!inner(full_name)
        `,
        )
        .in("session_id", sessionIds)
        .eq("status", "confirmed")

      const participantsBySession = new Map<string, Array<{ user_id: string; full_name: string | null }>>()

      allBookings?.forEach((booking) => {
        const sessionId = booking.session_id
        if (!participantsBySession.has(sessionId)) {
          participantsBySession.set(sessionId, [])
        }
        participantsBySession.get(sessionId)?.push({
          user_id: booking.user_id,
          full_name: (booking.profiles as any)?.full_name || null,
        })
      })

      const enrichedBookings = bookings.map((booking) => ({
        ...booking,
        participants: participantsBySession.get(booking.session_id) || [],
      }))

      setBookingsWithParticipants(enrichedBookings)
    }

    fetchParticipants()
  }, [bookings])

  const handleCancelClick = (bookingId: string, sessionDate: string, startTime: string) => {
    const hoursUntil = getHoursUntilSession(sessionDate, startTime)
    setConfirmCancelId(bookingId)
    setIsLateCancel(hoursUntil <= 5)
  }

  const handleConfirmCancel = async () => {
    if (!confirmCancelId) return

    setCancellingId(confirmCancelId)
    const result = await cancelBooking(confirmCancelId)

    if (result.success) {
      toast({
        title: t("bookingCancelled"),
        description: result.tokenRefunded ? t("tokenRefunded") : t("noTokenRefund"),
      })
      router.refresh()
    } else {
      toast({
        title: t("cancellationFailed"),
        description: result.error || t("cancellationFailedDesc"),
        variant: "destructive",
      })
    }
    setCancellingId(null)
    setConfirmCancelId(null)
    setIsLateCancel(false)
  }

  const upcomingBookings = bookingsWithParticipants.filter((b) => {
    if (b.status !== "confirmed") return false
    const session = b.gym_sessions
    if (!session) return false
    return !isSessionPast(session.session_date, session.end_time)
  })

  const pastBookings = bookingsWithParticipants.filter((b) => {
    if (b.status !== "confirmed") return false
    const session = b.gym_sessions
    if (!session) return false
    return isSessionPast(session.session_date, session.end_time)
  })

  return (
    <>
      <div className="space-y-4 md:sticky md:top-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("myBookings")}</h2>
          <p className="text-sm text-muted-foreground">{t("myBookingsDesc")}</p>
        </div>

        <div className="space-y-3 md:max-h-[calc(100vh-200px)] md:overflow-y-auto md:pr-2">
          {/* Upcoming Bookings */}
          {upcomingBookings.length > 0 ? (
            upcomingBookings.map((booking) => {
              const session = booking.gym_sessions
              if (!session) return null

              const hoursUntil = getHoursUntilSession(session.session_date, session.start_time)
              const isWithinFiveHours = hoursUntil <= 5 && hoursUntil > 0
              const participantCount = booking.participants?.length || 0

              return (
                <Card key={booking.id} className="overflow-hidden p-4 md:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2.5">
                      {/* Status Badge */}
                      <Badge
                        variant="default"
                        className="bg-primary flex w-fit items-center gap-1.5 px-2.5 py-1 text-xs"
                      >
                        <Clock className="h-3 w-3" />
                        {t("upcoming")}
                      </Badge>

                      {/* Date */}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-semibold">
                          {new Date(session.session_date).toLocaleDateString(language === "el" ? "el-GR" : "en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>

                      {/* Time */}
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">
                          {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}
                        </span>
                      </div>

                      {participantCount > 0 && !isSessionPast(session.session_date, session.end_time) && (
                        <div className="flex items-center gap-2 pt-1">
                          <ParticipantAvatars participants={booking.participants || []} maxDisplay={5} />
                          <span className="text-xs text-muted-foreground">
                            {participantCount} {participantCount === 1 ? "person" : "people"} booked
                          </span>
                        </div>
                      )}

                      {/* Warning for late cancellation */}
                      {isWithinFiveHours && (
                        <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2 py-1.5 text-[10px] text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
                          <AlertCircle className="h-3 w-3" />
                          <span className="font-medium">{t("cancelNowNoRefund")}</span>
                        </div>
                      )}
                    </div>

                    {/* Cancel Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCancelClick(booking.id, session.session_date, session.start_time)}
                      disabled={cancellingId === booking.id}
                      className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              )
            })
          ) : pastBookings.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16 text-center">
              <Calendar className="mb-3 h-12 w-12 text-muted-foreground/30" />
              <p className="font-medium text-muted-foreground">{t("noBookings")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("noBookingsDesc")}</p>
            </Card>
          ) : null}

          {/* Past Bookings Toggle */}
          {pastBookings.length > 0 && (
            <div className="space-y-3">
              <button
                onClick={() => setShowPastBookings(!showPastBookings)}
                className="flex w-full items-center justify-between rounded-xl bg-secondary/50 px-4 py-3 transition-colors hover:bg-secondary"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {pastBookings.length} {language === "el" ? "ολοκληρωμένες" : "completed"}
                  </span>
                </div>
                {showPastBookings ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {showPastBookings &&
                pastBookings.map((booking) => {
                  const session = booking.gym_sessions
                  if (!session) return null
                  const participantCount = booking.participants?.length || 0

                  return (
                    <Card key={booking.id} className="overflow-hidden p-4 opacity-60 md:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2.5">
                          <Badge variant="secondary" className="flex w-fit items-center gap-1.5 px-2.5 py-1 text-xs">
                            <CheckCircle2 className="h-3 w-3" />
                            {t("completed")}
                          </Badge>

                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-semibold">
                              {new Date(session.session_date).toLocaleDateString(
                                language === "el" ? "el-GR" : "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">
                              {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}
                            </span>
                          </div>

                          {participantCount > 0 && isAdmin && (
                            <div className="flex items-center gap-2 pt-1">
                              <ParticipantAvatars
                                participants={booking.participants || []}
                                maxDisplay={5}
                                isAdmin={isAdmin}
                                isPastSession={true}
                                currentUserId={booking.user_id}
                              />
                              <span className="text-xs text-muted-foreground">
                                {participantCount} {participantCount === 1 ? "person" : "people"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  )
                })}
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!confirmCancelId} onOpenChange={(open) => !open && setConfirmCancelId(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">{t("cancelBooking")}</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {isLateCancel ? (
                <>
                  <span className="mb-2 flex items-center gap-2 font-medium text-amber-600">
                    <AlertCircle className="h-5 w-5" />
                    {t("lessThanFiveHours")}
                  </span>
                  {t("cancelWithinFiveHours")}
                </>
              ) : (
                t("confirmCancelBooking")
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3">
            <AlertDialogCancel className="flex-1 rounded-full">{t("keepBooking")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              className="flex-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLateCancel ? t("cancelWithoutRefund") : t("cancelBooking")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
