"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useLanguage } from "@/lib/i18n/language-context"

interface ActivityChartProps {
  data: {
    date: string
    workouts: number
  }[]
}

export function ActivityChart({ data }: ActivityChartProps) {
  const { t } = useLanguage()

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-base md:text-lg">{t("activityOverview")}</CardTitle>
      </CardHeader>
      <CardContent className="p-2 md:p-6">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="workoutGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis
              stroke="#888888"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Area type="monotone" dataKey="workouts" stroke="#dc2626" strokeWidth={2} fill="url(#workoutGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
