"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Calendar,
  Users,
  Zap,
  UserMinus,
  Ban,
  MessageSquare,
  Settings,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import {
  cancelBookingAsAdmin,
  cancelAllSessionBookings,
  sendMessageToBookers,
  updateSession,
} from "@/lib/actions/admin"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { BookingsGraph } from "@/components/bookings-graph"
import { useLanguage } from "@/lib/i18n/language-context"

interface Booking {
  id: string
  user_id: string
  status: string
  booked_at: string
  profiles: {
    id: string
    full_name: string | null
    phone: string | null
  } | null
}

interface SessionWithBookings {
  id: string
  session_date: string
  start_time: string
  end_time: string
  total_slots: number
  available_slots: number
  is_open: boolean
  bookings: Booking[]
}

interface AdminOverviewProps {
  upcomingSessions: SessionWithBookings[]
  stats: {
    totalMembers: number
    activeSubscriptions: number
    todaySessions: number
    todayBookings: number
  }
}

export function AdminOverview({ upcomingSessions, stats }: AdminOverviewProps) {
  const { toast } = useToast()
  const router = useRouter()
  const { t } = useLanguage()
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())
  const [cancelingBooking, setCancelingBooking] = useState<string | null>(null)
  const [cancelingSession, setCancelingSession] = useState<string | null>(null)
  const [messagingSession, setMessagingSession] = useState<string | null>(null)
  const [editingCapacity, setEditingCapacity] = useState<string | null>(null)
  const [messageTitle, setMessageTitle] = useState("")
  const [messageContent, setMessageContent] = useState("")
  const [newCapacity, setNewCapacity] = useState(10)
  const [refundTokens, setRefundTokens] = useState(true)
  const [loading, setLoading] = useState(false)

  const toggleSession = (sessionId: string) => {
    setExpandedSessions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId)
      } else {
        newSet.add(sessionId)
      }
      return newSet
    })
  }

  const handleCancelBooking = async (bookingId: string) => {
    setLoading(true)
    const result = await cancelBookingAsAdmin(bookingId, refundTokens)
    setLoading(false)
    setCancelingBooking(null)

    if (result.success) {
      toast({
        title: "Booking cancelled",
        description: `Booking cancelled successfully${refundTokens ? " with token refund" : ""}`,
      })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to cancel booking",
        variant: "destructive",
      })
    }
  }

  const handleCancelAllBookings = async (sessionId: string) => {
    setLoading(true)
    const result = await cancelAllSessionBookings(sessionId, refundTokens)
    setLoading(false)
    setCancelingSession(null)

    if (result.success) {
      toast({
        title: "All bookings cancelled",
        description: `${result.count} bookings cancelled${refundTokens ? " with token refunds" : ""}`,
      })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to cancel bookings",
        variant: "destructive",
      })
    }
  }

  const handleSendMessage = async (sessionId: string) => {
    if (!messageTitle.trim() || !messageContent.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both title and message",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    const result = await sendMessageToBookers(sessionId, messageTitle, messageContent)
    setLoading(false)
    setMessagingSession(null)
    setMessageTitle("")
    setMessageContent("")

    if (result.success) {
      toast({
        title: "Message sent",
        description: `Message sent to ${result.count} members`,
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to send message",
        variant: "destructive",
      })
    }
  }

  const handleUpdateCapacity = async (sessionId: string) => {
    setLoading(true)
    const result = await updateSession(sessionId, { total_slots: newCapacity })
    setLoading(false)
    setEditingCapacity(null)

    if (result.success) {
      toast({
        title: "Capacity updated",
        description: `Session capacity changed to ${newCapacity} slots`,
      })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update capacity",
        variant: "destructive",
      })
    }
  }

  const confirmedBookings = (bookings: Booking[]) => bookings.filter((b) => b.status === "confirmed")

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 md:gap-4">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("totalMembers")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeSubscriptions} {t("activeSubscriptions")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("todaySessions")}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.todaySessions}</div>
            <p className="text-xs text-muted-foreground">{t("scheduledForToday")}</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("todayBookings")}</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.todayBookings}</div>
            <p className="text-xs text-muted-foreground">{t("confirmedBookings")}</p>
          </CardContent>
        </Card>
      </div>

      <BookingsGraph sessions={upcomingSessions} />

      {/* Upcoming Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>{t("upcomingSessions")}</CardTitle>
          <p className="text-sm text-muted-foreground">Manage bookings and session capacity for the next 20 sessions</p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-3">
              {upcomingSessions.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No upcoming sessions</p>
              ) : (
                upcomingSessions.map((session) => {
                  const confirmed = confirmedBookings(session.bookings)
                  const isExpanded = expandedSessions.has(session.id)
                  const occupancyPercent = Math.round(
                    ((session.total_slots - session.available_slots) / session.total_slots) * 100,
                  )

                  return (
                    <Collapsible key={session.id} open={isExpanded} onOpenChange={() => toggleSession(session.id)}>
                      <Card className="border-border/50">
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {new Date(session.session_date).toLocaleDateString("el-GR", {
                                    weekday: "short",
                                    day: "numeric",
                                    month: "short",
                                  })}
                                </span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {session.start_time.slice(0, 5)}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <Badge variant={confirmed.length > 0 ? "default" : "secondary"}>
                                  {confirmed.length} / {session.total_slots}
                                </Badge>
                                <Badge
                                  variant={
                                    occupancyPercent > 80
                                      ? "destructive"
                                      : occupancyPercent > 50
                                        ? "default"
                                        : "secondary"
                                  }
                                >
                                  {occupancyPercent}%
                                </Badge>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="border-t p-4 space-y-4">
                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingCapacity(session.id)
                                  setNewCapacity(session.total_slots)
                                }}
                              >
                                <Settings className="h-4 w-4 mr-1" />
                                Change Capacity
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setMessagingSession(session.id)}
                                disabled={confirmed.length === 0}
                              >
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Message All ({confirmed.length})
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setCancelingSession(session.id)}
                                disabled={confirmed.length === 0}
                              >
                                <Ban className="h-4 w-4 mr-1" />
                                Cancel All
                              </Button>
                            </div>

                            {/* Bookings List */}
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium">Bookings ({confirmed.length})</h4>
                              {confirmed.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No bookings yet</p>
                              ) : (
                                <div className="space-y-2">
                                  {confirmed.map((booking) => (
                                    <div
                                      key={booking.id}
                                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                                    >
                                      <div className="flex items-center gap-3">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        <div>
                                          <p className="text-sm font-medium">
                                            {booking.profiles?.full_name || "Unknown"}
                                          </p>
                                          <p className="text-xs text-muted-foreground">{booking.profiles?.phone}</p>
                                        </div>
                                      </div>
                                      <Button size="sm" variant="ghost" onClick={() => setCancelingBooking(booking.id)}>
                                        <UserMinus className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Cancel Booking Dialog */}
      <Dialog open={!!cancelingBooking} onOpenChange={() => setCancelingBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this booking? The user will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <Switch checked={refundTokens} onCheckedChange={setRefundTokens} id="refund" />
            <Label htmlFor="refund">Refund training token</Label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelingBooking(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelingBooking && handleCancelBooking(cancelingBooking)}
              disabled={loading}
            >
              {loading ? "Cancelling..." : "Confirm Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel All Bookings Dialog */}
      <Dialog open={!!cancelingSession} onOpenChange={() => setCancelingSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel All Bookings</DialogTitle>
            <DialogDescription>
              This will cancel all bookings for this session. All users will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <Switch checked={refundTokens} onCheckedChange={setRefundTokens} id="refund-all" />
            <Label htmlFor="refund-all">Refund training tokens</Label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelingSession(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelingSession && handleCancelAllBookings(cancelingSession)}
              disabled={loading}
            >
              {loading ? "Cancelling..." : "Confirm Cancel All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={!!messagingSession} onOpenChange={() => setMessagingSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message to Bookers</DialogTitle>
            <DialogDescription>This message will be sent to all users who booked this session</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={messageTitle}
                onChange={(e) => setMessageTitle(e.target.value)}
                placeholder="Message title"
              />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Your message"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessagingSession(null)}>
              Cancel
            </Button>
            <Button onClick={() => messagingSession && handleSendMessage(messagingSession)} disabled={loading}>
              {loading ? "Sending..." : "Send Message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Capacity Dialog */}
      <Dialog open={!!editingCapacity} onOpenChange={() => setEditingCapacity(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Session Capacity</DialogTitle>
            <DialogDescription>Adjust the total number of available slots for this session</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="capacity">Total Slots</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                max="50"
                value={newCapacity}
                onChange={(e) => setNewCapacity(Number.parseInt(e.target.value) || 10)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCapacity(null)}>
              Cancel
            </Button>
            <Button onClick={() => editingCapacity && handleUpdateCapacity(editingCapacity)} disabled={loading}>
              {loading ? "Updating..." : "Update Capacity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
