import React from "react"
import { redirect } from "next/navigation"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Use admin client to bypass RLS and check if user owns a gym
  const adminClient = await createAdminClient()

  // Fix: Handle case where user has multiple gyms by taking the most recent one
  const { data: ownedGym, error: gymError } = await adminClient
    .from("gyms")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (ownedGym) {
    // Get profile data
    const { data: profile } = await adminClient
      .from("profiles")
      .select("full_name, age")
      .eq("id", user.id)
      .single()

    // User owns a gym - they have owner access
    return (
      <div className="flex min-h-screen flex-col">
        <DashboardNav gym={ownedGym} user={user} role="owner" profile={profile} />
        <main className="flex-1">{children}</main>
      </div>
    )
  }

  // Check if user is a member of a gym
  const { data: membership } = await adminClient
    .from("gym_members")
    .select("gym_id, role")
    .eq("user_id", user.id)
    .maybeSingle()

  if (membership) {
    // Get gym slug for redirect
    const { data: gym } = await adminClient
      .from("gyms")
      .select("slug")
      .eq("id", membership.gym_id)
      .single()

    if (gym && gym.slug) {
      // Allow members to access the dashboard
      // redirect(`/gym/${gym.slug}`)
      return (
        <div className="flex min-h-screen flex-col">
          <main className="flex-1">{children}</main>
        </div>
      )
    }
  }

  // If not owner and not member (or member of invalid gym), redirect to onboarding
  redirect("/onboarding")

}
