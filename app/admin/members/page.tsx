import { createClient, createAdminClient } from "@/lib/supabase/server"
import { MemberManager } from "@/components/member-manager"

export default async function AdminMembersPage() {
  const supabase = await createAdminClient()

  const { data: members } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

  return (
    <>
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Member Management</h1>
        <p className="text-muted-foreground">Manage member subscriptions and workout tokens</p>
      </div>

      <MemberManager members={members || []} />
    </>
  )
}
