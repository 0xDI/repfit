"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAllUsers() {
  const supabase = await createAdminClient()

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role, created_at")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching users:", error)
    return { success: false, error: error.message, users: [] }
  }

  // Get emails from auth.users
  const { data: authUsers } = await supabase.auth.admin.listUsers()

  const usersWithEmail = profiles.map((profile) => {
    const authUser = authUsers?.users.find((u) => u.id === profile.id)
    return {
      ...profile,
      email: authUser?.email || null,
    }
  })

  return { success: true, users: usersWithEmail }
}

export async function promoteToAdmin(userId: string) {
  const supabase = await createClient()

  // Check if current user is admin
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: currentProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (currentProfile?.role !== "admin") {
    return { success: false, error: "Not authorized" }
  }

  // Promote user to admin
  const { error } = await supabase.from("profiles").update({ role: "admin", is_admin: true }).eq("id", userId)

  if (error) {
    console.error("Error promoting user:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/admins")
  return { success: true }
}

export async function demoteFromAdmin(userId: string) {
  const supabase = await createClient()

  // Check if current user is admin
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: currentProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (currentProfile?.role !== "admin") {
    return { success: false, error: "Not authorized" }
  }

  // Prevent self-demotion
  if (user.id === userId) {
    return { success: false, error: "Cannot demote yourself" }
  }

  // Demote user from admin
  const { error } = await supabase.from("profiles").update({ role: "user", is_admin: false }).eq("id", userId)

  if (error) {
    console.error("Error demoting user:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/admins")
  return { success: true }
}
