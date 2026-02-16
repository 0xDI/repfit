"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { X, Bell } from "lucide-react"
import { useState } from "react"
import { markNotificationRead } from "@/lib/actions/notifications"
import { useLanguage } from "@/lib/i18n/language-context"

interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "warning" | "success" | "error"
  created_at: string
}

interface NotificationBannerProps {
  notifications: Notification[]
}

export function NotificationBanner({ notifications: initialNotifications }: NotificationBannerProps) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const { t } = useLanguage()

  const handleDismiss = async (notificationId: string) => {
    await markNotificationRead(notificationId)
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
  }

  const displayNotifications = notifications.slice(0, 1)

  if (displayNotifications.length === 0) return null

  return (
    <div className="space-y-3">
      {displayNotifications.map((notification) => (
        <Alert key={notification.id} className="relative pr-12">
          <Bell className="h-4 w-4" />
          <AlertTitle>{notification.title}</AlertTitle>
          <AlertDescription className="text-sm">{notification.message}</AlertDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6"
            onClick={() => handleDismiss(notification.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      ))}
    </div>
  )
}
