"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

interface GymFormData {
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zip: string
  description?: string
  operating_hours?: string
  max_capacity?: number | string
}

export async function createGym(formData: GymFormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const gymData = {
    owner_id: user.id,
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    address: formData.address,
    city: formData.city,
    state: formData.state,
    zip_code: formData.zip,
    operating_hours: formData.operating_hours,
    max_capacity: formData.max_capacity ? parseInt(formData.max_capacity.toString()) : null,
    country: "US",
    timezone: "America/New_York",
    payment_method: "manual",
    subscription_status: "trial",
  }

  const { data: gym, error } = await supabase
    .from("gyms")
    .insert(gymData)
    .select()
    .single()

  if (error) {
    console.error("Failed to create gym:", error)
    return { error: error.message }
  }

  // Update onboarding status
  await supabase
    .from("gyms")
    .update({ onboarding_completed: true })
    .eq("id", gym.id)

  revalidatePath('/dashboard', 'layout')
  revalidatePath('/onboarding', 'layout')

  return { data: gym }
}

export async function completeOnboarding(gymId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("gyms")
    .update({ onboarding_completed: true })
    .eq("id", gymId)

  if (error) {
    return { error: error.message }
  }

  redirect("/dashboard")
}

export async function checkOnboardingStatus() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { needsOnboarding: false, isAuthenticated: false }
  }

  const { data: gyms } = await supabase
    .from("gyms")
    .select("id, name, onboarding_completed, subscription_status")
    .eq("owner_id", user.id)

  if (!gyms || gyms.length === 0) {
    return { needsOnboarding: true, isAuthenticated: true }
  }

  const hasIncompleteOnboarding = gyms.some(
    (gym) => !gym.onboarding_completed
  )

  return {
    needsOnboarding: hasIncompleteOnboarding,
    isAuthenticated: true,
    gyms,
  }
}

export async function startFreeTrial(gymId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  console.log("Starting trial for gym:", gymId, "user:", user.id)

  // First check if gym exists and belongs to user
  const { data: gym, error: fetchError } = await supabase
    .from("gyms")
    .select("id, owner_id, subscription_status")
    .eq("id", gymId)
    .single()

  if (fetchError) {
    console.error("Failed to fetch gym:", fetchError)
    return { error: `Gym not found: ${fetchError.message}` }
  }

  console.log("Found gym:", gym)

  if (gym.owner_id !== user.id) {
    return { error: "You don't own this gym" }
  }

  // Use admin client to bypass RLS for update (we've already verified ownership)
  const adminClient = await createAdminClient()

  const { error } = await adminClient
    .from("gyms")
    .update({
      subscription_status: "trial",
      onboarding_completed: true
    })
    .eq("id", gymId)

  if (error) {
    console.error("Failed to start trial:", error)
    return { error: error.message }
  }

  revalidatePath('/dashboard', 'layout')
  revalidatePath('/onboarding', 'layout')

  return { success: true }
}
