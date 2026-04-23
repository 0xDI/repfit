"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, Check } from "lucide-react"
import type { Notification } from "@/lib/types"
import { markNotificationRead, markAllNotificationsRead } from "@/lib/actions/notifications"
import { useRouter } from "next/navigation"

interface NotificationsListProps {
  notifications: Notification[]
}

export function NotificationsList({ notifications }: NotificationsListProps) {
  const router = useRouter()

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id)
    router.refresh()
  }

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead()
    router.refresh()
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <Check className="mr-2 h-4 w-4" />
            Mark All as Read
          </Button>
        </div>
      )}

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="mb-3 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">No notifications yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={
                notification.is_read && notification.type !== "admin_message"
                  ? "opacity-60"
                  : "border-primary/50 bg-primary/5"
              }
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{notification.title}</h3>
                      {!notification.is_read && <Badge variant="default">New</Badge>}
                      {notification.type === "admin_message" && <Badge variant="secondary">Announcement</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>

                  {!notification.is_read && notification.type !== "admin_message" && (
                    <Button variant="ghost" size="sm" onClick={() => handleMarkRead(notification.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
