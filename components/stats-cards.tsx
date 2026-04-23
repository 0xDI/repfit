"use client"

import { Card } from "@/components/ui/card"
import { Coins, TrendingUp, Calendar } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"
import { StreakWidget } from "./streak-widget"
import { differenceInDays } from "date-fns"

interface StatsCardsProps {
  workoutTokens: number
  totalTrainings?: number
  totalBookings: number
  upcomingBookings: number
  completedThisMonth: number
  currentStreak: number
  longestStreak: number
  weeklyActivity?: number[]
  subscriptionEndDate?: string | null
}

export function StatsCards({
  workoutTokens,
  totalTrainings,
  totalBookings,
  upcomingBookings,
  completedThisMonth,
  currentStreak,
  longestStreak,
  weeklyActivity = [0, 1, 0, 2, 1, 0, 1],
  subscriptionEndDate,
}: StatsCardsProps) {
  const { t, language } = useLanguage()

  const maxActivity = Math.max(...weeklyActivity, 1)
  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"]
  const totalWeekWorkouts = weeklyActivity.reduce((a, b) => a + b, 0)

  const endDate = subscriptionEndDate ? new Date(subscriptionEndDate) : null
  const daysRemaining = endDate ? differenceInDays(endDate, new Date()) : null
  const showExpiry = daysRemaining !== null && daysRemaining > 0 && daysRemaining < 365

  return (
    <>
      {/* Mobile: 2 stats + streak widget */}
      <div className="grid grid-cols-2 gap-3 md:hidden">
        {/* Workout Tokens */}
        <Card className="relative overflow-hidden border-border/40 bg-card/50 backdrop-blur-sm p-5 group hover:border-primary/30 transition-all">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 group-hover:bg-primary transition-colors" />
          <div className="relative z-10 space-y-1">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t("workoutTokens")}</p>
            </div>
            <p className="text-4xl font-black tracking-tight text-primary">{workoutTokens}</p>
            {showExpiry ? (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  {language === "el" ? `Λήγει σε ${daysRemaining} μέρες` : `${daysRemaining}d remaining`}
                </span>
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground">{t("availableForBooking")}</p>
            )}
          </div>
          <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors" />
        </Card>

        <Card className="relative overflow-hidden border-border/40 bg-card/50 backdrop-blur-sm p-4 group hover:border-primary/30 transition-all">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t("weeklyActivity")}</p>
              <div className="flex items-center gap-1 text-primary">
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs font-bold">{totalWeekWorkouts}</span>
              </div>
            </div>

            {/* Mini bar chart */}
            <div className="flex items-end justify-between gap-1 flex-1 min-h-[48px]">
              {weeklyActivity.map((count, i) => (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-full flex items-end justify-center h-10">
                    <div
                      className={`w-full max-w-[14px] rounded-full transition-all duration-500 ${count > 0 ? "bg-gradient-to-t from-primary to-orange-400" : "bg-muted/50"
                        }`}
                      style={{
                        height: count > 0 ? `${Math.max((count / maxActivity) * 100, 20)}%` : "4px",
                      }}
                    />
                  </div>
                  <span className="text-[9px] text-muted-foreground">{dayLabels[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <StreakWidget
          currentStreak={currentStreak}
          longestStreak={longestStreak}
          completedThisMonth={completedThisMonth}
        />
      </div>

      {/* Desktop: All 4 stats in a row */}
      <div className="hidden grid-cols-4 gap-4 md:grid">
        {/* Workout Tokens */}
        <Card className="relative overflow-hidden border-border/40 bg-card/50 backdrop-blur-sm p-5 group hover:border-primary/30 transition-all">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 group-hover:bg-primary transition-colors" />
          <div className="relative z-10 space-y-1">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t("workoutTokens")}</p>
            </div>
            <p className="text-4xl font-black tracking-tight text-primary">{workoutTokens}</p>
            {showExpiry ? (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  {language === "el" ? `Λήγει σε ${daysRemaining} μέρες` : `${daysRemaining}d remaining`}
                </span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">{t("availableForBooking")}</p>
            )}
          </div>
          <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors" />
        </Card>

        <Card className="relative overflow-hidden border-border/40 bg-card/50 backdrop-blur-sm p-5 group hover:border-primary/30 transition-all">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t("weeklyActivity")}</p>
              <div className="flex items-center gap-1 text-primary">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-bold">{totalWeekWorkouts}</span>
              </div>
            </div>

            {/* Mini bar chart */}
            <div className="flex items-end justify-between gap-1.5 flex-1 min-h-[52px]">
              {weeklyActivity.map((count, i) => (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-full flex items-end justify-center h-10">
                    <div
                      className={`w-full max-w-[16px] rounded-full transition-all duration-500 ${count > 0 ? "bg-gradient-to-t from-primary to-orange-400" : "bg-muted/50"
                        }`}
                      style={{
                        height: count > 0 ? `${Math.max((count / maxActivity) * 100, 20)}%` : "4px",
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{dayLabels[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* This Month */}
        <Card className="relative overflow-hidden border-border/40 bg-card/50 backdrop-blur-sm p-5 group hover:border-primary/30 transition-all">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/30 group-hover:bg-emerald-500 transition-colors" />
          <div className="relative z-10 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t("thisMonth")}</p>
            <p className="text-4xl font-black tracking-tight">{completedThisMonth}</p>
            <p className="text-xs text-muted-foreground">{t("completed")}</p>
          </div>
        </Card>

        {/* Current Streak */}
        <Card className="relative overflow-hidden border-border/40 bg-gradient-to-br from-primary/15 to-primary/5 backdrop-blur-sm p-5 group hover:border-primary/30 transition-all">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary group-hover:bg-primary transition-colors" />
          <div className="relative z-10 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t("currentStreak")}</p>
            <p className="text-4xl font-black tracking-tight text-primary">{currentStreak}</p>
            <p className="text-xs text-muted-foreground">{t("daysStreak")}</p>
          </div>
        </Card>
      </div>
    </>
  )
}
