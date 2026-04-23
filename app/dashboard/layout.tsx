import React from "react"
import { redirect } from "next/navigation"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"

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

  // Check if user is a member of a gym
  const { data: membership } = await adminClient
    .from("gym_members")
    .select("gym_id, role")
    .eq("user_id", user.id)
    .maybeSingle()

  // Fix: Handle case where user has multiple gyms by taking the most recent one
  const { data: ownedGym } = await adminClient
    .from("gyms")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (ownedGym && !membership) {
    // Only redirect gym owners who are NOT members of any gym to the admin panel
    // If they have a membership, let them see the customer dashboard
    redirect("/admin")
  }

  if (membership) {
    // Get gym slug and name for redirect and header
    const { data: gym } = await adminClient
      .from("gyms")
      .select("name, slug")
      .eq("id", membership.gym_id)
      .single()

    if (gym && gym.slug) {
      // Fetch profile for the header
      const { data: profile } = await adminClient
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      return (
        <div className="flex min-h-screen flex-col">
          <DashboardHeader
            profile={profile}
            userEmail={user.email}
            currentGym={{ name: gym.name, slug: gym.slug }}
          />
          <main className="flex-1">{children}</main>
        </div>
      )
    }
  }

  // If not owner and not member (or member of invalid gym), redirect to onboarding
  redirect("/onboarding")
}
