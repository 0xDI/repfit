"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

export async function ensureProfileExists(userId: string, email: string) {
  try {
    // Use service role key to bypass RLS
    const supabaseServiceRole = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    // Check if profile exists
    const { data: existingProfile } = await supabaseServiceRole.from("profiles").select("*").eq("id", userId).single()

    if (existingProfile) {
      console.log("[v0] Existing profile role:", existingProfile.role)
      return { success: true, profile: existingProfile }
    }

    const { data: newProfile, error } = await supabaseServiceRole
      .from("profiles")
      .insert({
        id: userId,
        phone: null,
        full_name: null,
        age: null,
        role: "user",
        workout_tokens: 0,
        subscription_status: "inactive",
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating profile:", error)
      return { success: false, error: error.message }
    }

    console.log("[v0] New profile created with role:", newProfile.role)
    return { success: true, profile: newProfile }
  } catch (error: any) {
    console.error("[v0] Exception creating profile:", error)
    return { success: false, error: error.message }
  }
}

export async function updateProfile(data: { full_name?: string }) {
  // Import createAdminClient at the top of the file
  const { createAdminClient } = await import("@/lib/supabase/server")

  const supabase = await createClient()
  const adminClient = await createAdminClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error } = await adminClient.from("profiles").update(data).eq("id", user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/profile")
  return { success: true }
}

export async function updateUserInfo(data: { full_name: string; age: number }) {
  // Import createAdminClient at the top of the file
  const { createAdminClient } = await import("@/lib/supabase/server")

  const supabase = await createClient()
  const adminClient = await createAdminClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Use admin client to bypass RLS policies that cause recursion
  const { error } = await adminClient.from("profiles").update(data).eq("id", user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard")
  return { success: true }
}
