"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Calendar, Clock, Users } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface PastSession {
  id: string
  session_date: string
  start_time: string
  end_time: string
  max_participants: number
  bookings: Array<{
    id: string
    user_id: string
    booked_at: string
    profiles: {
      full_name: string | null
      email: string | null
      phone: string | null
    }
  }>
}

export function PastSessionsAdmin() {
  const [sessions, setSessions] = useState<PastSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPastSessions() {
      const supabase = createClient()
      const today = new Date().toISOString().split("T")[0]

      const { data } = await supabase
        .from("gym_sessions")
        .select(
          `
          id,
          session_date,
          start_time,
          end_time,
          max_participants,
          bookings!inner(
            id,
            user_id,
            booked_at,
            status,
            profiles(
              full_name,
              email,
              phone
            )
          )
        `,
        )
        .lt("session_date", today)
        .eq("bookings.status", "confirmed")
        .order("session_date", { ascending: false })
        .order("start_time", { ascending: false })
        .limit(50)

      setSessions((data as any) || [])
      setLoading(false)
    }

    fetchPastSessions()
  }, [])

  const getInitials = (name: string | null) => {
    if (!name) return "?"
    const parts = name.trim().split(" ")
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  const getColorClass = (userId: string) => {
    const colors = [
      "bg-red-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-orange-500",
    ]
    const hash = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  const formatDisplayName = (name: string | null, email: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ")
    }
    if (email) {
      const username = email.split("@")[0]
      return username.charAt(0).toUpperCase() + username.slice(1)
    }
    return "Unknown User"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading past sessions...</div>
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-16 text-center">
        <Calendar className="mb-3 h-12 w-12 text-muted-foreground/30" />
        <p className="font-medium text-muted-foreground">No past sessions found</p>
        <p className="mt-1 text-sm text-muted-foreground">Past sessions with attendees will appear here</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Past Sessions</h2>
          <p className="text-sm text-muted-foreground">View all completed sessions with attendee details</p>
        </div>
        <Badge variant="secondary">{sessions.length} sessions</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sessions.map((session) => {
          const attendeeCount = session.bookings?.length || 0
          const fillPercentage = (attendeeCount / session.max_participants) * 100

          return (
            <Card key={session.id} className="p-5 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    Completed
                  </Badge>
                  <span className="text-xs text-muted-foreground">{Math.round(fillPercentage)}% full</span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">
                    {new Date(session.session_date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {attendeeCount} / {session.max_participants} attended
                  </span>
                </div>
              </div>

              {attendeeCount > 0 && (
                <div className="space-y-2 border-t pt-4">
                  <p className="text-xs font-medium text-muted-foreground">Attendees</p>
                  <div className="space-y-2">
                    {session.bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback
                            className={`text-xs font-semibold text-white ${getColorClass(booking.user_id)}`}
                          >
                            {getInitials(booking.profiles?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {formatDisplayName(booking.profiles?.full_name, booking.profiles?.email)}
                          </p>
                          {booking.profiles?.phone && (
                            <p className="text-xs text-muted-foreground">{booking.profiles.phone}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
