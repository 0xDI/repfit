import { createClient } from "@/lib/supabase/server"
import { AdminManager } from "@/components/admin-manager"
import { getAllUsers } from "@/lib/actions/admin-management"

export default async function AdminManagementPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { users } = await getAllUsers()

  return (
    <>
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Admin Management</h1>
        <p className="text-muted-foreground">Promote or demote users to admin status</p>
      </div>

      <AdminManager users={users} currentUserId={user?.id || ""} />
    </>
  )
}
