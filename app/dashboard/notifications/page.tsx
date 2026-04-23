import { redirect } from "next/navigation"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NotificationsList } from "@/components/notifications-list"

export default async function NotificationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const adminClient = await createAdminClient()
  const { data: profile } = await adminClient.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/auth/login")
  }

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const { data: adminMessages } = await adminClient
    .from("admin_messages")
    .select("*")
    .eq("is_active", true)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("created_at", { ascending: false })

  const formattedAdminMessages = (adminMessages || []).map((msg) => ({
    id: msg.id,
    user_id: user.id,
    title: msg.title,
    message: msg.message,
    type: "admin_message",
    is_read: true, // Marked as read to avoid badge count issues, but styled as active
    created_at: msg.created_at,
  }))

  const allNotifications = [...(formattedAdminMessages || []), ...(notifications || [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false)

  return (
    <div className="min-h-screen bg-background">

      <main className="mx-auto max-w-4xl space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with your gym activities</p>
        </div>

        <NotificationsList notifications={allNotifications} />
      </main>
    </div>
  )
}
