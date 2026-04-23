"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Play, Plus, Trash2, CalendarX } from "lucide-react"
import type { WeeklySchedule, ScheduleOverride } from "@/lib/types"
import {
  getWeeklySchedule,
  saveWeeklyScheduleDay,
  toggleWeeklyScheduleDay,
  deleteWeeklyScheduleDay,
  applyWeeklySchedule,
  getScheduleOverrides,
  createScheduleOverride,
  deleteScheduleOverride,
} from "@/lib/actions/admin"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
]

export function WeeklyScheduleManager() {
  const { toast } = useToast()
  const router = useRouter()
  const [schedule, setSchedule] = useState<WeeklySchedule[]>([])
  const [overrides, setOverrides] = useState<ScheduleOverride[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [weeksAhead, setWeeksAhead] = useState(4)

  const [editingDay, setEditingDay] = useState<number | null>(null)
  const [dayForm, setDayForm] = useState({
    start_time: "09:00",
    end_time: "21:00",
    total_slots: 10,
    workout_duration_minutes: 60,
    is_enabled: true,
  })

  const [overrideForm, setOverrideForm] = useState({
    override_date: "",
    is_closed: true,
    start_time: "",
    end_time: "",
    total_slots: 10,
    reason: "",
  })
  const [addingOverride, setAddingOverride] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [scheduleResult, overridesResult] = await Promise.all([getWeeklySchedule(), getScheduleOverrides()])
    if (scheduleResult.success) {
      setSchedule(scheduleResult.schedule)
    }
    if (overridesResult.success) {
      setOverrides(overridesResult.overrides)
    }
    setLoading(false)
  }

  const handleEditDay = (dayOfWeek: number) => {
    const existing = schedule.find((s) => s.day_of_week === dayOfWeek)
    if (existing) {
      setDayForm({
        start_time: existing.start_time.slice(0, 5),
        end_time: existing.end_time.slice(0, 5),
        total_slots: existing.total_slots,
        workout_duration_minutes: existing.workout_duration_minutes,
        is_enabled: existing.is_enabled,
      })
    } else {
      setDayForm({
        start_time: "09:00",
        end_time: "21:00",
        total_slots: 10,
        workout_duration_minutes: 60,
        is_enabled: true,
      })
    }
    setEditingDay(dayOfWeek)
  }

  const handleSaveDay = async () => {
    if (editingDay === null) return

    const result = await saveWeeklyScheduleDay({
      day_of_week: editingDay,
      start_time: dayForm.start_time,
      end_time: dayForm.end_time,
      total_slots: dayForm.total_slots,
      workout_duration_minutes: dayForm.workout_duration_minutes,
      is_enabled: dayForm.is_enabled,
    })

    if (result.success) {
      toast({ title: "Schedule saved" })
      setEditingDay(null)
      loadData()
    } else {
      toast({ title: "Failed to save", description: result.error, variant: "destructive" })
    }
  }

  const handleToggleDay = async (dayOfWeek: number, isEnabled: boolean) => {
    const result = await toggleWeeklyScheduleDay(dayOfWeek, isEnabled)
    if (result.success) {
      toast({ title: isEnabled ? "Day enabled" : "Day disabled" })
      loadData()
    } else {
      toast({ title: "Failed to update", description: result.error, variant: "destructive" })
    }
  }

  const handleDeleteDay = async (dayOfWeek: number) => {
    if (!confirm("Remove this day from the weekly schedule?")) return

    const result = await deleteWeeklyScheduleDay(dayOfWeek)
    if (result.success) {
      toast({ title: "Day removed from schedule" })
      loadData()
    } else {
      toast({ title: "Failed to remove", description: result.error, variant: "destructive" })
    }
  }

  const handleApplySchedule = async () => {
    if (
      !confirm(
        `This will delete all existing future sessions and create new ones based on your weekly schedule for the next ${weeksAhead} weeks. Continue?`,
      )
    ) {
      return
    }

    setApplying(true)
    const result = await applyWeeklySchedule(weeksAhead)
    if (result.success) {
      toast({ title: `Created ${result.count} sessions for the next ${weeksAhead} weeks` })
      router.refresh()
    } else {
      toast({ title: "Failed to apply schedule", description: result.error, variant: "destructive" })
    }
    setApplying(false)
  }

  const handleAddOverride = async () => {
    if (!overrideForm.override_date) {
      toast({ title: "Please select a date", variant: "destructive" })
      return
    }

    const result = await createScheduleOverride({
      override_date: overrideForm.override_date,
      is_closed: overrideForm.is_closed,
      start_time: overrideForm.is_closed ? null : overrideForm.start_time || null,
      end_time: overrideForm.is_closed ? null : overrideForm.end_time || null,
      total_slots: overrideForm.is_closed ? null : overrideForm.total_slots,
      reason: overrideForm.reason || null,
    })

    if (result.success) {
      toast({ title: "Override added" })
      setAddingOverride(false)
      setOverrideForm({
        override_date: "",
        is_closed: true,
        start_time: "",
        end_time: "",
        total_slots: 10,
        reason: "",
      })
      loadData()
    } else {
      toast({ title: "Failed to add override", description: result.error, variant: "destructive" })
    }
  }

  const handleDeleteOverride = async (id: string) => {
    const result = await deleteScheduleOverride(id)
    if (result.success) {
      toast({ title: "Override removed" })
      loadData()
    } else {
      toast({ title: "Failed to remove", description: result.error, variant: "destructive" })
    }
  }

  const getDaySchedule = (dayOfWeek: number) => {
    return schedule.find((s) => s.day_of_week === dayOfWeek)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading schedule...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="weekly" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="weekly">Weekly Template</TabsTrigger>
          <TabsTrigger value="overrides">Date Overrides</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Weekly Schedule Template</CardTitle>
              <CardDescription>Set your regular gym hours for each day of the week</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {DAYS_OF_WEEK.map((day) => {
                const daySchedule = getDaySchedule(day.value)
                return (
                  <div key={day.value} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-3">
                      <div className="w-20">
                        <span className="font-medium text-sm">{day.short}</span>
                      </div>
                      {daySchedule ? (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                          <Badge variant={daySchedule.is_enabled ? "default" : "secondary"} className="w-fit">
                            {daySchedule.start_time.slice(0, 5)} - {daySchedule.end_time.slice(0, 5)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {daySchedule.workout_duration_minutes}min slots, {daySchedule.total_slots} max
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not configured</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {daySchedule && (
                        <Switch
                          checked={daySchedule.is_enabled}
                          onCheckedChange={(checked) => handleToggleDay(day.value, checked)}
                        />
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleEditDay(day.value)}>
                        {daySchedule ? "Edit" : "Add"}
                      </Button>
                      {daySchedule && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeleteDay(day.value)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Apply Schedule Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Apply Schedule</CardTitle>
              <CardDescription>Generate sessions from your weekly template</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                <div className="space-y-2 w-full sm:w-auto">
                  <Label htmlFor="weeks">Weeks Ahead</Label>
                  <Input
                    id="weeks"
                    type="number"
                    min={1}
                    max={12}
                    value={weeksAhead}
                    onChange={(e) => setWeeksAhead(Number.parseInt(e.target.value))}
                    className="w-full sm:w-24"
                  />
                </div>
                <Button
                  onClick={handleApplySchedule}
                  disabled={applying || schedule.filter((s) => s.is_enabled).length === 0}
                  className="w-full sm:w-auto"
                >
                  <Play className="mr-2 h-4 w-4" />
                  {applying ? "Applying..." : "Apply to Calendar"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This will replace all future sessions with ones generated from your weekly template. Date overrides will
                be respected.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overrides" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Date Overrides</CardTitle>
                  <CardDescription>Temporary changes to your regular schedule</CardDescription>
                </div>
                <Dialog open={addingOverride} onOpenChange={setAddingOverride}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Override
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Date Override</DialogTitle>
                      <DialogDescription>Close the gym or change hours for a specific date</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={overrideForm.override_date}
                          onChange={(e) => setOverrideForm({ ...overrideForm, override_date: e.target.value })}
                          min={new Date().toISOString().split("T")[0]}
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={overrideForm.is_closed}
                          onCheckedChange={(checked) => setOverrideForm({ ...overrideForm, is_closed: checked })}
                        />
                        <Label>Gym is closed this day</Label>
                      </div>
                      {!overrideForm.is_closed && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Opens At</Label>
                              <Input
                                type="text"
                                placeholder="09:00"
                                value={overrideForm.start_time}
                                onChange={(e) => setOverrideForm({ ...overrideForm, start_time: e.target.value })}
                                pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Closes At</Label>
                              <Input
                                type="text"
                                placeholder="21:00"
                                value={overrideForm.end_time}
                                onChange={(e) => setOverrideForm({ ...overrideForm, end_time: e.target.value })}
                                pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Max People</Label>
                            <Input
                              type="number"
                              min={1}
                              value={overrideForm.total_slots}
                              onChange={(e) =>
                                setOverrideForm({ ...overrideForm, total_slots: Number.parseInt(e.target.value) })
                              }
                            />
                          </div>
                        </>
                      )}
                      <div className="space-y-2">
                        <Label>Reason (optional)</Label>
                        <Input
                          placeholder="e.g., Holiday, Maintenance"
                          value={overrideForm.reason}
                          onChange={(e) => setOverrideForm({ ...overrideForm, reason: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddingOverride(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddOverride}>Add Override</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {overrides.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No date overrides configured</p>
              ) : (
                <div className="space-y-2">
                  {overrides.map((override) => (
                    <div key={override.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        {override.is_closed ? (
                          <CalendarX className="h-4 w-4 text-destructive" />
                        ) : (
                          <Calendar className="h-4 w-4 text-primary" />
                        )}
                        <div>
                          <p className="font-medium text-sm">
                            {new Date(override.override_date).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {override.is_closed ? (
                              <span className="text-destructive">Closed</span>
                            ) : (
                              `${override.start_time?.slice(0, 5)} - ${override.end_time?.slice(0, 5)}`
                            )}
                            {override.reason && ` - ${override.reason}`}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDeleteOverride(override.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Day Dialog */}
      <Dialog open={editingDay !== null} onOpenChange={(open) => !open && setEditingDay(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDay !== null && DAYS_OF_WEEK.find((d) => d.value === editingDay)?.label} Schedule
            </DialogTitle>
            <DialogDescription>Set the gym hours for this day of the week</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Opens At</Label>
                <Input
                  type="text"
                  placeholder="09:00"
                  value={dayForm.start_time}
                  onChange={(e) => setDayForm({ ...dayForm, start_time: e.target.value })}
                  pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
                />
              </div>
              <div className="space-y-2">
                <Label>Closes At</Label>
                <Input
                  type="text"
                  placeholder="21:00"
                  value={dayForm.end_time}
                  onChange={(e) => setDayForm({ ...dayForm, end_time: e.target.value })}
                  pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Max People at Once</Label>
              <Input
                type="number"
                min={1}
                value={dayForm.total_slots}
                onChange={(e) => setDayForm({ ...dayForm, total_slots: Number.parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Workout Duration (minutes)</Label>
              <Input
                type="number"
                min={15}
                max={240}
                step={15}
                value={dayForm.workout_duration_minutes}
                onChange={(e) => setDayForm({ ...dayForm, workout_duration_minutes: Number.parseInt(e.target.value) })}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={dayForm.is_enabled}
                onCheckedChange={(checked) => setDayForm({ ...dayForm, is_enabled: checked })}
              />
              <Label>Enabled</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDay(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDay}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
