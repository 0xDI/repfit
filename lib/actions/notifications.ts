"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type = "info",
  expiresAt?: Date,
) {
  const supabase = await createClient()

  const notificationData: any = {
    user_id: userId,
    title,
    message,
    type,
    is_read: false,
  }

  if (expiresAt) {
    notificationData.expires_at = expiresAt.toISOString()
  }

  const { error } = await supabase.from("notifications").insert(notificationData)

  if (error) {
    console.error("Failed to create notification:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard")
  return { success: true }
}

export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/notifications")
  return { success: true }
}

export async function markAllNotificationsRead() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/notifications")
  return { success: true }
}
