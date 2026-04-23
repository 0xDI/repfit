"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { sendSubscriptionRenewalConfirmation, sendSubscriptionUpdatedEmail } from "@/lib/email/resend"
import { createNotification } from "./notifications"

export async function getSubscriptionPlans() {
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("is_active", true)
    .order("price", { ascending: true })

  if (error) {
    console.error("[v0] getSubscriptionPlans error:", error)
    return []
  }
  return data || []
}

export async function createSubscriptionPlan(formData: {
  name: string
  description: string
  training_count: number
  duration_days: number
  price: number
}) {
  const supabase = await createAdminClient()

  const { error } = await supabase.from("subscription_plans").insert(formData)

  if (error) throw error

  revalidatePath("/admin/subscriptions")
  return { success: true }
}

export async function updateSubscriptionPlan(
  id: string,
  formData: Partial<{
    name: string
    description: string
    training_count: number
    duration_days: number
    price: number
    is_active: boolean
  }>,
) {
  const supabase = await createAdminClient()

  const { error } = await supabase.from("subscription_plans").update(formData).eq("id", id)

  if (error) throw error

  revalidatePath("/admin/subscriptions")
  return { success: true }
}

export async function assignSubscription(formData: {
  user_id: string
  plan_id: string
  start_date: string
  price_paid?: number
  payment_status?: "pending" | "paid" | "overdue"
  payment_method?: string
}) {
  const supabase = await createAdminClient()

  // Get plan details
  const { data: plan, error: planError } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("id", formData.plan_id)
    .single()

  if (planError) throw planError

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", formData.user_id)
    .single()

  if (profileError) throw profileError

  // Calculate end date
  const startDate = new Date(formData.start_date)
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + plan.duration_days)
  const endDateString = endDate.toISOString().split("T")[0]

  // Create subscription
  const { data: subscription, error: subError } = await supabase
    .from("user_subscriptions")
    .insert({
      user_id: formData.user_id,
      plan_id: formData.plan_id,
      plan_name: plan.name,
      plan_price: plan.price,
      start_date: formData.start_date,
      end_date: endDateString,
      remaining_trainings: plan.training_count,
      total_trainings: plan.training_count,
      status: "active",
    })
    .select()
    .single()

  if (subError) throw subError

  // Record payment if paid
  if (formData.payment_status === "paid" && formData.price_paid) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    await supabase.from("payment_history").insert({
      user_id: formData.user_id,
      subscription_id: subscription.id,
      amount: formData.price_paid,
      payment_method: formData.payment_method,
    })

    await createNotification(
      formData.user_id,
      "New Subscription Activated",
      `Your ${plan.name} subscription has been activated with ${plan.training_count} trainings!`,
      "success",
    )

    if (profile.phone) {
      try {
        await sendSubscriptionRenewalConfirmation(
          profile.phone,
          profile.full_name || "Valued Customer",
          plan.name,
          plan.training_count,
          endDateString,
          formData.price_paid,
        )
      } catch (emailError) {
        console.error("Failed to send renewal confirmation email:", emailError)
      }
    }
  }

  revalidatePath("/admin/subscriptions")
  revalidatePath("/admin/customers")
  revalidatePath("/dashboard")
  return { success: true, subscription }
}

export async function getUserSubscriptions(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("user_subscriptions")
    .select("*, subscription_plans(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function getCurrentUserSubscription() {
  const supabase = await createClient()

  console.log("[v0] getCurrentUserSubscription - START")

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("[v0] getCurrentUserSubscription - User:", user?.id, user?.email)

  if (!user) {
    console.log("[v0] getCurrentUserSubscription - No user found")
    return null
  }

  const { data: allSubs, error: allSubsError } = await supabase
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", user.id)

  console.log("[v0] getCurrentUserSubscription - All subscriptions for user:", JSON.stringify(allSubs, null, 2))
  console.log("[v0] getCurrentUserSubscription - All subs error:", allSubsError)

  const { data, error } = await supabase
    .from("user_subscriptions")
    .select("*, subscription_plans(*)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("end_date", { ascending: false })
    .limit(1)
    .maybeSingle()

  console.log("[v0] getCurrentUserSubscription - Active subscription query error:", error)
  console.log("[v0] getCurrentUserSubscription - Active subscription data:", JSON.stringify(data, null, 2))

  if (error) {
    console.error("[v0] getCurrentUserSubscription - Error fetching subscription:", error)
    return null
  }

  if (!data) {
    console.log("[v0] getCurrentUserSubscription - No subscription data found")
    return null
  }

  const result = {
    id: data.id,
    user_id: data.user_id,
    plan_id: data.plan_id,
    plan_name: data.plan_name,
    plan_price: data.plan_price,
    total_trainings: data.total_trainings,
    remaining_trainings: data.remaining_trainings,
    start_date: data.start_date,
    end_date: data.end_date,
    status: data.status,
    subscription_plans: data.subscription_plans,
  }

  console.log("[v0] getCurrentUserSubscription - Returning result:", JSON.stringify(result, null, 2))

  return result
}

export async function decrementTraining(userId: string) {
  const supabase = await createClient()

  // Get active subscription
  const { data: subscription, error: subError } = await supabase
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("end_date", { ascending: false })
    .limit(1)
    .single()

  if (subError || !subscription) {
    throw new Error("No active subscription found")
  }

  const { error: updateError } = await supabase
    .from("user_subscriptions")
    .update({
      remaining_trainings: subscription.remaining_trainings - 1,
    })
    .eq("id", subscription.id)

  if (updateError) throw updateError

  revalidatePath("/dashboard")
  return { success: true }
}

export async function getAllCustomersWithSubscriptions() {
  const supabase = await createAdminClient()

  // Get all non-admin profiles
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_admin", false)
    .order("full_name", { ascending: true })

  if (profilesError) throw profilesError

  // Get all user subscriptions with plan details
  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from("user_subscriptions")
    .select("*, subscription_plans(*)")
    .order("created_at", { ascending: false })

  if (subscriptionsError) throw subscriptionsError

  // Manually combine the data
  const customersWithSubscriptions = profiles.map((profile) => ({
    ...profile,
    user_subscriptions: subscriptions.filter((sub) => sub.user_id === profile.id),
  }))

  return customersWithSubscriptions
}

export async function getPaymentHistory(userId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from("payment_history")
    .select("*, profiles!payment_history_user_id_fkey(full_name)")
    .order("payment_date", { ascending: false })

  if (userId) {
    query = query.eq("user_id", userId)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function updateUserSubscription(
  subscriptionId: string,
  updates: {
    remaining_trainings?: number
    end_date?: string
    status?: string
  },
) {
  const supabase = await createAdminClient()

  // Get subscription with user and plan details
  const { data: subscription, error: fetchError } = await supabase
    .from("user_subscriptions")
    .select("*, subscription_plans(*), profiles(full_name, phone)")
    .eq("id", subscriptionId)
    .single()

  if (fetchError) throw fetchError

  // Update subscription
  const { error: updateError } = await supabase.from("user_subscriptions").update(updates).eq("id", subscriptionId)

  if (updateError) throw updateError

  // Send notification and email
  const profile = subscription.profiles as any
  const plan = subscription.subscription_plans as any

  await createNotification(
    subscription.user_id,
    "Subscription Updated",
    `Your ${plan.name} subscription has been updated. Check your dashboard for details.`,
    "info",
  )

  if (profile?.phone) {
    try {
      await sendSubscriptionUpdatedEmail(
        profile.phone,
        profile.full_name || "Valued Customer",
        plan.name,
        updates.remaining_trainings || subscription.remaining_trainings,
        updates.end_date || subscription.end_date,
      )
    } catch (emailError) {
      console.error("Failed to send subscription updated email:", emailError)
    }
  }

  revalidatePath("/admin/subscriptions")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function recordPayment(formData: {
  user_id: string
  subscription_id?: string
  amount: number
  payment_method: string
  notes?: string
}) {
  const supabase = await createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase.from("payment_history").insert({
    ...formData,
    created_by: user?.id,
  })

  if (error) throw error

  // Update subscription payment status if subscription_id provided
  if (formData.subscription_id) {
    await supabase
      .from("user_subscriptions")
      .update({
        payment_status: "paid",
        payment_date: new Date().toISOString(),
      })
      .eq("id", formData.subscription_id)
  }

  revalidatePath("/admin/customers")
  revalidatePath("/admin/subscriptions")
  return { success: true }
}
