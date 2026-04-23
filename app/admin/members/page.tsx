import { createClient, createAdminClient } from "@/lib/supabase/server"
import { MemberManager } from "@/components/member-manager"
import { cookies } from "next/headers"

export default async function AdminMembersPage() {
  const supabase = await createClient()

  // Get user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const adminClient = await createAdminClient()

  // Get owned gyms to determine active gym
  const { data: ownedGyms } = await adminClient
    .from("gyms")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })

  const cookieStore = await cookies()
  const activeGymCookie = cookieStore.get("active_gym_id")?.value
  const activeGym = (activeGymCookie && ownedGyms?.find(g => g.id === activeGymCookie)) || ownedGyms?.[0] || null

  if (!activeGym) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2 border-b border-border/40 pb-6">
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">Members</h1>
          <p className="text-sm font-medium text-muted-foreground">Manage gym members, subscriptions, and training tokens.</p>
        </div>
        <p className="text-muted-foreground">Please create a gym to view members.</p>
      </div>
    )
  }

  // Get members for this specific gym (two-step: gym_members -> profiles)
  const { data: gymMemberRows } = await adminClient
    .from("gym_members")
    .select("user_id")
    .eq("gym_id", activeGym.id)
    .order("created_at", { ascending: false })

  const memberUserIds = gymMemberRows?.map(m => m.user_id).filter(Boolean) || []

  let members: any[] = []
  if (memberUserIds.length > 0) {
    const { data: profiles } = await adminClient
      .from("profiles")
      .select("*")
      .in("id", memberUserIds)
    members = profiles || []
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 border-b border-border/40 pb-6">
        <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">Members</h1>
        <p className="text-sm font-medium text-muted-foreground">Manage gym members, subscriptions, and training tokens.</p>
      </div>

      <MemberManager members={members as any[]} />
    </div>
  )
}
