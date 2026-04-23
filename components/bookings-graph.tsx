"use client"

import { Card } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"

interface SessionWithBookings {
  id: string
  session_date: string
  start_time: string
  end_time: string
  total_slots: number
  available_slots: number
  bookings: Array<{ status: string }>
}

interface BookingsGraphProps {
  sessions: SessionWithBookings[]
}

export function BookingsGraph({ sessions }: BookingsGraphProps) {
  const { t } = useLanguage()

  const weeklyData = Array(7).fill(0)
  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"]

  sessions.forEach((session) => {
    const date = new Date(session.session_date)
    const dayIndex = (date.getDay() + 6) % 7 // Convert Sunday=0 to Monday=0
    const confirmedBookings = session.bookings.filter((b) => b.status === "confirmed").length
    weeklyData[dayIndex] += confirmedBookings
  })

  const maxBookings = Math.max(...weeklyData, 1)
  const totalWeekBookings = weeklyData.reduce((a, b) => a + b, 0)

  return (
    <Card className="relative overflow-hidden bg-secondary p-6">
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm font-medium text-muted-foreground">This Week</p>
          <div className="flex items-center gap-1 text-primary">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-bold">{totalWeekBookings}</span>
          </div>
        </div>

        <div className="flex items-end justify-between gap-1.5 flex-1 min-h-[120px]">
          {weeklyData.map((count, i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-1">
              <div className="w-full flex items-end justify-center h-24">
                <div
                  className={`w-full max-w-[16px] rounded-sm transition-all duration-500 ${
                    count > 0 ? "bg-primary" : "bg-muted"
                  }`}
                  style={{
                    height: count > 0 ? `${Math.max((count / maxBookings) * 100, 20)}%` : "4px",
                  }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{dayLabels[i]}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
