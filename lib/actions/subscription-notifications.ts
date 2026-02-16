"use server"

import { createClient } from "@/lib/supabase/server"
import { sendSubscriptionExpiredEmail, sendSubscriptionLowBalanceEmail } from "@/lib/email/resend"

export async function checkAndSendSubscriptionNotifications() {
  const supabase = await createClient()

  // Get all active subscriptions
  const { data: subscriptions, error } = await supabase
    .from("user_subscriptions")
    .select(
      `
      *,
      profiles!user_subscriptions_user_id_fkey(id, full_name, phone),
      subscription_plans(*)
    `,
    )
    .eq("status", "active")

  if (error || !subscriptions) {
    console.error("Error fetching subscriptions:", error)
    return
  }

  const today = new Date()
  const notifications = []

  for (const sub of subscriptions) {
    const plan = sub.subscription_plans
    const profile = sub.profiles

    if (!plan || !profile) continue

    const endDate = new Date(sub.end_date)
    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    let shouldNotify = false
    const notificationType: "trainings" | "days" = plan.notification_type
    let remainingCount = 0

    // Check based on notification type
    if (plan.notification_type === "trainings") {
      remainingCount = sub.trainings_remaining
      shouldNotify = remainingCount <= plan.notification_threshold && remainingCount > 0 && !sub.low_balance_notified
    } else {
      // days
      remainingCount = daysUntilExpiry
      shouldNotify = daysUntilExpiry <= plan.notification_threshold && daysUntilExpiry > 0 && !sub.low_balance_notified
    }

    // Send low balance notification
    if (shouldNotify && profile.phone) {
      try {
        await sendSubscriptionLowBalanceEmail(
          profile.phone,
          profile.full_name || "Valued Customer",
          plan.name,
          remainingCount,
          notificationType,
        )

        // Mark as notified
        await supabase.from("user_subscriptions").update({ low_balance_notified: true }).eq("id", sub.id)

        // Create in-app notification
        await supabase.from("notifications").insert({
          user_id: profile.id,
          title:
            notificationType === "trainings"
              ? `Only ${remainingCount} Training${remainingCount === 1 ? "" : "s"} Left!`
              : `Subscription Expires in ${remainingCount} Day${remainingCount === 1 ? "" : "s"}!`,
          message:
            notificationType === "trainings"
              ? `Your ${plan.name} plan has only ${remainingCount} training${remainingCount === 1 ? "" : "s"} remaining. Contact us to renew!`
              : `Your ${plan.name} subscription will expire in ${remainingCount} day${remainingCount === 1 ? "" : "s"}. Renew now to continue your training!`,
          type: "subscription_warning",
        })

        notifications.push({ userId: profile.id, type: "low_balance" })
      } catch (error) {
        console.error(`Failed to send notification to ${profile.phone}:`, error)
      }
    }

    // Check if expired (trainings = 0 or past end date)
    const isExpired = sub.trainings_remaining <= 0 || daysUntilExpiry <= 0

    if (isExpired && !sub.expiry_notified && profile.phone) {
      try {
        await sendSubscriptionExpiredEmail(profile.phone, profile.full_name || "Valued Customer", plan.name, plan.price)

        // Mark as expired and notified
        await supabase
          .from("user_subscriptions")
          .update({
            status: "expired",
            expiry_notified: true,
          })
          .eq("id", sub.id)

        // Create in-app notification
        await supabase.from("notifications").insert({
          user_id: profile.id,
          title: "Subscription Expired",
          message: `Your ${plan.name} subscription has expired. Contact us at +30 693 704 3559 to renew and continue training!`,
          type: "subscription_expired",
        })

        notifications.push({ userId: profile.id, type: "expired" })
      } catch (error) {
        console.error(`Failed to send expiry notification to ${profile.phone}:`, error)
      }
    }
  }

  return { success: true, notificationsSent: notifications.length, notifications }
}
