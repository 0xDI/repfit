"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Edit2, Check, X, Users, MessageSquare, Ban, AlertTriangle } from "lucide-react"
import type { GymSession } from "@/lib/types"
import {
  createSession,
  deleteSession,
  updateSession,
  createRecurringSessions,
  deleteAllSessions,
  getSessionBookings,
  cancelBookingAsAdmin,
  sendMessageToBookers,
  cancelAllSessionBookings,
} from "@/lib/actions/admin"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface SessionManagerProps {
  sessions: GymSession[]
}

interface BookingWithProfile {
  id: string
  user_id: string
  session_id: string
  status: string
  booked_at: string
  profiles: {
    id: string
    full_name: string | null
    phone: string | null
  } | null
}

export function SessionManager({ sessions }: SessionManagerProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [isDeletingAll, setIsDeletingAll] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDuration, setEditDuration] = useState<number>(60)

  const [viewingBookings, setViewingBookings] = useState<string | null>(null)
  const [bookings, setBookings] = useState<BookingWithProfile[]>([])
  const [loadingBookings, setLoadingBookings] = useState(false)

  const [messagingSession, setMessagingSession] = useState<string | null>(null)
  const [messageTitle, setMessageTitle] = useState("")
  const [messageContent, setMessageContent] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)

  const [formData, setFormData] = useState({
    session_date: "",
    start_time: "",
    end_time: "",
    total_slots: 10,
    workout_duration_minutes: 60,
    recurring: "none" as "none" | "daily" | "weekly",
    recurrence_count: 4,
  })

  // ... existing code for handleCreate ...
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.start_time && formData.end_time && formData.start_time >= formData.end_time) {
      toast({
        title: "Invalid time range",
        description: "Closing time must be after opening time",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)

    try {
      let result
      if (formData.recurring !== "none") {
        result = await createRecurringSessions({
          session_date: formData.session_date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          total_slots: formData.total_slots,
          workout_duration_minutes: formData.workout_duration_minutes,
          recurring: formData.recurring,
          recurrence_count: formData.recurrence_count,
        })
      } else {
        result = await createSession({
          session_date: formData.session_date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          total_slots: formData.total_slots,
          workout_duration_minutes: formData.workout_duration_minutes,
        })
      }

      if (result.success) {
        toast({
          title:
            formData.recurring !== "none"
              ? `${result.count || formData.recurrence_count} sessions created successfully`
              : "Session created successfully",
        })
        setFormData({
          session_date: "",
          start_time: "",
          end_time: "",
          total_slots: 10,
          workout_duration_minutes: 60,
          recurring: "none",
          recurrence_count: 4,
        })
        router.refresh()
      } else {
        toast({ title: "Failed to create session", description: result.error, variant: "destructive" })
      }
    } catch (error) {
      toast({
        title: "Error creating session",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this session?")) {
      return
    }

    try {
      const result = await deleteSession(id)

      if (result.success) {
        toast({ title: "Session deleted" })
        router.refresh()
      } else {
        toast({ title: "Failed to delete", description: result.error, variant: "destructive" })
      }
    } catch (error) {
      toast({
        title: "Error deleting session",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAll = async () => {
    if (
      !confirm("Are you sure you want to delete ALL sessions? This will also cancel all bookings and cannot be undone.")
    ) {
      return
    }

    setIsDeletingAll(true)
    try {
      const result = await deleteAllSessions()

      if (result.success) {
        toast({ title: "All sessions deleted" })
        router.refresh()
      } else {
        toast({ title: "Failed to delete sessions", description: result.error, variant: "destructive" })
      }
    } catch (error) {
      toast({
        title: "Error deleting sessions",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setIsDeletingAll(false)
    }
  }

  const handleToggleOpen = async (id: string, currentState: boolean) => {
    try {
      const result = await updateSession(id, { is_open: !currentState })

      if (result.success) {
        toast({ title: currentState ? "Session closed" : "Session opened" })
        router.refresh()
      } else {
        toast({ title: "Failed to update", description: result.error, variant: "destructive" })
      }
    } catch (error) {
      toast({
        title: "Error updating session",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  const handleUpdateDuration = async (id: string) => {
    try {
      const result = await updateSession(id, { workout_duration_minutes: editDuration })

      if (result.success) {
        toast({ title: "Workout duration updated" })
        setEditingId(null)
        router.refresh()
      } else {
        toast({ title: "Failed to update", description: result.error, variant: "destructive" })
      }
    } catch (error) {
      toast({
        title: "Error updating duration",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  const handleViewBookings = async (sessionId: string) => {
    setViewingBookings(sessionId)
    setLoadingBookings(true)
    try {
      const result = await getSessionBookings(sessionId)
      if (result.success) {
        setBookings(result.bookings as BookingWithProfile[])
      } else {
        toast({ title: "Failed to load bookings", description: result.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error loading bookings", variant: "destructive" })
    } finally {
      setLoadingBookings(false)
    }
  }

  const handleCancelBooking = async (bookingId: string, refund: boolean) => {
    try {
      const result = await cancelBookingAsAdmin(bookingId, refund)
      if (result.success) {
        toast({ title: "Booking cancelled", description: refund ? "Token refunded" : "No refund issued" })
        if (viewingBookings) {
          handleViewBookings(viewingBookings)
        }
        router.refresh()
      } else {
        toast({ title: "Failed to cancel booking", description: result.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error cancelling booking", variant: "destructive" })
    }
  }

  const handleCancelAllBookings = async (sessionId: string, refund: boolean) => {
    if (
      !confirm(
        `Are you sure you want to cancel all bookings for this session?${refund ? " Tokens will be refunded." : ""}`,
      )
    ) {
      return
    }

    try {
      const result = await cancelAllSessionBookings(sessionId, refund)
      if (result.success) {
        toast({
          title: `${result.count} bookings cancelled`,
          description: refund ? "Tokens refunded" : "No refunds issued",
        })
        setViewingBookings(null)
        router.refresh()
      } else {
        toast({ title: "Failed to cancel bookings", description: result.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error cancelling bookings", variant: "destructive" })
    }
  }

  const handleSendMessage = async () => {
    if (!messagingSession || !messageTitle.trim() || !messageContent.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" })
      return
    }

    setSendingMessage(true)
    try {
      const result = await sendMessageToBookers(messagingSession, messageTitle, messageContent)
      if (result.success) {
        toast({ title: `Message sent to ${result.count} bookers` })
        setMessagingSession(null)
        setMessageTitle("")
        setMessageContent("")
      } else {
        toast({ title: "Failed to send message", description: result.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error sending message", variant: "destructive" })
    } finally {
      setSendingMessage(false)
    }
  }

  const safeSessions = Array.isArray(sessions) ? sessions : []

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Create Session Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create Gym Hours</CardTitle>
          <CardDescription>Set when the gym is open for bookings</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            {/* ... existing form fields ... */}
            <div className="space-y-2">
              <Label htmlFor="date">Start Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.session_date}
                onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                required
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start">Opens At</Label>
                <Input
                  id="start"
                  type="text"
                  placeholder="HH:MM (e.g., 09:00)"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                  pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
                  title="Enter time in 24-hour format (HH:MM)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end">Closes At</Label>
                <Input
                  id="end"
                  type="text"
                  placeholder="HH:MM (e.g., 22:00)"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  required
                  pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
                  title="Enter time in 24-hour format (HH:MM)"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slots">Max People at Once</Label>
              <Input
                id="slots"
                type="number"
                min={1}
                max={50}
                value={formData.total_slots}
                onChange={(e) => setFormData({ ...formData, total_slots: Number.parseInt(e.target.value) })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of people allowed in the gym at the same time
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Workout Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min={15}
                max={240}
                step={15}
                value={formData.workout_duration_minutes}
                onChange={(e) =>
                  setFormData({ ...formData, workout_duration_minutes: Number.parseInt(e.target.value) })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Time range will be automatically split into {formData.workout_duration_minutes}-minute slots
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recurring">Recurring Schedule</Label>
              <Select
                value={formData.recurring}
                onValueChange={(value: "none" | "daily" | "weekly") => setFormData({ ...formData, recurring: value })}
              >
                <SelectTrigger id="recurring">
                  <SelectValue placeholder="Select recurrence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">One-time session</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.recurring !== "none" && (
              <div className="space-y-2">
                <Label htmlFor="count">Number of {formData.recurring === "daily" ? "Days" : "Weeks"}</Label>
                <Input
                  id="count"
                  type="number"
                  min={1}
                  max={52}
                  value={formData.recurrence_count}
                  onChange={(e) => setFormData({ ...formData, recurrence_count: Number.parseInt(e.target.value) })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {(() => {
                    const [startHour, startMinute] = formData.start_time.split(":").map(Number) || [0, 0]
                    const [endHour, endMinute] = formData.end_time.split(":").map(Number) || [0, 0]
                    const startMinutes = startHour * 60 + startMinute
                    const endMinutes = endHour * 60 + endMinute
                    const slotsPerDay = Math.floor((endMinutes - startMinutes) / formData.workout_duration_minutes)
                    const totalSlots = slotsPerDay * formData.recurrence_count
                    return totalSlots > 0 ? `This will create ${totalSlots} time slots` : "Set time range to see total"
                  })()}
                </p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isCreating}>
              <Plus className="mr-2 h-4 w-4" />
              {formData.recurring !== "none" ? `Create ${formData.recurrence_count} Sessions` : "Create Session"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>Scheduled Sessions</CardTitle>
              <CardDescription>Manage gym opening hours</CardDescription>
            </div>
            {safeSessions.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteAll}
                disabled={isDeletingAll}
                className="w-full sm:w-auto"
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                {isDeletingAll ? "Deleting..." : "Delete All"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {safeSessions.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">No sessions scheduled</p>
            ) : (
              safeSessions.map((session) => (
                <div key={session.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">
                        {new Date(session.session_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}
                      </p>
                      {editingId === session.id ? (
                        <div className="flex items-center gap-2 mt-2">
                          <Input
                            type="number"
                            min={15}
                            max={240}
                            step={15}
                            value={editDuration}
                            onChange={(e) => setEditDuration(Number.parseInt(e.target.value))}
                            className="w-20 h-8"
                          />
                          <span className="text-xs text-muted-foreground">min</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleUpdateDuration(session.id)}
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground">
                            {session.workout_duration_minutes || 60} min per workout
                          </p>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => {
                              setEditingId(session.id)
                              setEditDuration(session.workout_duration_minutes || 60)
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={session.is_open ? "default" : "secondary"}>
                        {session.is_open ? "Open" : "Closed"}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {session.available_slots} / {session.total_slots} available
                    </p>

                    <div className="flex items-center gap-1 sm:gap-2">
                      <Dialog
                        open={viewingBookings === session.id}
                        onOpenChange={(open) => !open && setViewingBookings(null)}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewBookings(session.id)}
                            title="View Bookers"
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Bookings</DialogTitle>
                            <DialogDescription>
                              {new Date(session.session_date).toLocaleDateString()} {session.start_time.slice(0, 5)} -{" "}
                              {session.end_time.slice(0, 5)}
                            </DialogDescription>
                          </DialogHeader>
                          {loadingBookings ? (
                            <p className="text-center py-4 text-muted-foreground">Loading...</p>
                          ) : bookings.length === 0 ? (
                            <p className="text-center py-4 text-muted-foreground">No bookings yet</p>
                          ) : (
                            <div className="space-y-3">
                              {bookings.map((booking) => (
                                <div
                                  key={booking.id}
                                  className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                  <div>
                                    <p className="font-medium text-sm">{booking.profiles?.full_name || "Unknown"}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {booking.profiles?.phone || "No phone"}
                                    </p>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleCancelBooking(booking.id, true)}
                                      title="Cancel with refund"
                                    >
                                      <Ban className="h-4 w-4 text-orange-500" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleCancelBooking(booking.id, false)}
                                      title="Cancel without refund"
                                    >
                                      <X className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              {bookings.length > 0 && (
                                <div className="flex gap-2 pt-2 border-t">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 bg-transparent"
                                    onClick={() => handleCancelAllBookings(session.id, true)}
                                  >
                                    Cancel All (Refund)
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => handleCancelAllBookings(session.id, false)}
                                  >
                                    Cancel All (No Refund)
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      <Dialog
                        open={messagingSession === session.id}
                        onOpenChange={(open) => !open && setMessagingSession(null)}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setMessagingSession(session.id)}
                            title="Message Bookers"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Message Bookers</DialogTitle>
                            <DialogDescription>
                              Send a notification to all people who booked this session
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="msg-title">Title</Label>
                              <Input
                                id="msg-title"
                                placeholder="e.g., Session Time Change"
                                value={messageTitle}
                                onChange={(e) => setMessageTitle(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="msg-content">Message</Label>
                              <Textarea
                                id="msg-content"
                                placeholder="Enter your message..."
                                value={messageContent}
                                onChange={(e) => setMessageContent(e.target.value)}
                                rows={4}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={handleSendMessage}
                              disabled={sendingMessage || !messageTitle.trim() || !messageContent.trim()}
                            >
                              {sendingMessage ? "Sending..." : "Send Message"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Switch
                        checked={session.is_open}
                        onCheckedChange={() => handleToggleOpen(session.id, session.is_open)}
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(session.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
