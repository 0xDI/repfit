"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface WorkoutChartProps {
  data: Array<{
    month: string
    workouts: number
  }>
}

export function WorkoutChart({ data }: WorkoutChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workout Frequency</CardTitle>
        <CardDescription>Your monthly workout activity over the last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            workouts: {
              label: "Workouts",
              color: "hsl(var(--primary))",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="workouts" fill="var(--color-workouts)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
