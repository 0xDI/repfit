"use client"

import { Card } from "@/components/ui/card"
import { Flame } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"
import { useEffect, useState } from "react"

interface StreakWidgetProps {
  currentStreak: number
  longestStreak: number
  completedThisMonth: number
}

export function StreakWidget({ currentStreak, longestStreak, completedThisMonth }: StreakWidgetProps) {
  const { t } = useLanguage()
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    setAnimate(true)
  }, [])

  const motivationalMessages = {
    en: {
      0: "Start your streak today!",
      1: "You're on fire! Keep it up!",
      3: "Amazing! 3 days strong!",
      7: "One week streak! Incredible!",
      14: "Two weeks! You're unstoppable!",
      30: "A month! You're a champion!",
    },
    el: {
      0: "Ξεκίνα το σερί σου σήμερα!",
      1: "Πάμε δυνατά! Συνέχισε!",
      3: "Απίστευτο! 3 μέρες!",
      7: "Μια εβδομάδα! Εκπληκτικό!",
      14: "Δύο εβδομάδες! Ασταμάτητος!",
      30: "Ένας μήνας! Είσαι πρωταθλητής!",
    },
  }

  const lang = useLanguage().language
  const getMotivationalMessage = () => {
    const messages = motivationalMessages[lang]
    if (currentStreak >= 30) return messages[30]
    if (currentStreak >= 14) return messages[14]
    if (currentStreak >= 7) return messages[7]
    if (currentStreak >= 3) return messages[3]
    if (currentStreak >= 1) return messages[1]
    return messages[0]
  }

  return (
    <Card className="relative col-span-2 overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-4 text-primary-foreground">
      {/* Background decoration with animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 transition-transform duration-1000 ${animate ? "scale-150" : "scale-100"}`}
        />
        <div
          className={`absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/10 transition-transform delay-200 duration-1000 ${animate ? "scale-150" : "scale-100"}`}
        />
      </div>

      <div className="relative z-10 flex items-center justify-between gap-4">
        {/* Streak flame icon with pulse animation */}
        <div className="flex items-center gap-3">
          <div className={`rounded-full bg-white/20 p-2.5 ${animate ? "animate-pulse" : ""}`}>
            <Flame className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-xs font-medium opacity-90">{lang === "en" ? "Current Streak" : "Τρέχον Σερί"}</p>
            <p className="text-2xl font-bold">
              {currentStreak} {lang === "en" ? "days" : "μέρες"}
            </p>
            <p className="mt-0.5 text-xs font-medium opacity-90">{getMotivationalMessage()}</p>
          </div>
        </div>

        {/* This month stat only */}
        <div className="rounded-lg bg-white/10 px-4 py-2 text-center">
          <p className="text-xs font-medium opacity-80">{lang === "en" ? "This Month" : "Αυτόν τον Μήνα"}</p>
          <p className="text-2xl font-bold">{completedThisMonth}</p>
        </div>
      </div>
    </Card>
  )
}
